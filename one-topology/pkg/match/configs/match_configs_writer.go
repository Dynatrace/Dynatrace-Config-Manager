// @license
// Copyright 2023 Dynatrace LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package configs

import (
	"encoding/json"
	"fmt"
	"path"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"time"

	"github.com/dynatrace-oss/terraform-provider-dynatrace/dynatrace/api"
	//"github.com/dynatrace-oss/terraform-provider-dynatrace/dynatrace/settings/services/cache/tar"
	"github.com/dynatrace/dynatrace-configuration-as-code/internal/log"
	"github.com/dynatrace/dynatrace-configuration-as-code/internal/slices"
	config "github.com/dynatrace/dynatrace-configuration-as-code/pkg/config/v2"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/configs/tar"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/rules"
	"github.com/spf13/afero"
)

func genMultiMatchedMap(matchParameters match.MatchParameters, remainingResultsPtr *match.CompareResultList, configProcessingPtr *match.MatchProcessing, configsTypeInfo configTypeInfo, configIdxToWriteSource *[]bool, prevMatches MatchOutputType) (map[string][]string, MatchStatus, Module, error) {

	printMultiMatchedSample(remainingResultsPtr, configProcessingPtr)

	matchEntityMatches := Module{
		"schemaId": configsTypeInfo.configTypeString,
		"data":     MatchEntityMatch{},
		"stats":    map[string]int{},
	}

	multiMatched := map[string][]string{}
	matchStatus := MatchStatus{
		Source: MatchStatusEnv{
			actionStatus: make([]rune, len(*configProcessingPtr.Source.RawMatchList.GetValues())),
			errorStatus:  make([]rune, len(*configProcessingPtr.Source.RawMatchList.GetValues())),
		},
		Target: MatchStatusEnv{
			actionStatus: make([]rune, len(*configProcessingPtr.Target.RawMatchList.GetValues())),
			errorStatus:  make([]rune, len(*configProcessingPtr.Target.RawMatchList.GetValues())),
		},
	}

	if len(remainingResultsPtr.CompareResults) <= 0 {
		return multiMatched, matchStatus, matchEntityMatches, nil
	}

	firstIdx := 0
	currentSourceId := remainingResultsPtr.CompareResults[0].LeftId

	addMatchingMultiMatched := func(matchCount int) error {
		configIdSource := (*configProcessingPtr.Source.RawMatchList.GetValues())[currentSourceId].(map[string]interface{})[rules.ConfigIdKey].(string)

		_, foundPrev := prevMatches.Matches[configIdSource]
		if foundPrev {
			return nil
		}

		multiMatchedMatches := make([]string, matchCount)
		for j := 0; j < matchCount; j++ {
			compareResult := remainingResultsPtr.CompareResults[(j + firstIdx)]
			targetId := compareResult.RightId

			matchStatus.Target.actionStatus[targetId] = match.ACTION_UPDATE_RUNE
			matchStatus.Target.errorStatus[targetId] = match.STATUS_MULTI_MATCH_RUNE

			var err error

			areConfigsIdentical, err := areConfigsIdentical(configProcessingPtr, currentSourceId, targetId, configsTypeInfo)
			if err != nil {
				return err
			}

			actionStatus := match.ACTION_UPDATE_RUNE
			if areConfigsIdentical {
				actionStatus = match.ACTION_IDENTICAL_RUNE
			}

			status := string(actionStatus) + ", " + string(matchStatus.Target.errorStatus[targetId])
			err = addConfigResult(matchParameters, configProcessingPtr, &matchEntityMatches, configIdxToWriteSource, ConfigResultParam{currentSourceId, targetId, status, actionStatus})
			if err != nil {
				return err
			}

			multiMatchedMatches[j] = (*configProcessingPtr.Target.RawMatchList.GetValues())[targetId].(map[string]interface{})[rules.ConfigIdKey].(string)
		}
		matchStatus.Source.actionStatus[currentSourceId] = match.ACTION_UPDATE_RUNE
		matchStatus.Source.errorStatus[currentSourceId] = match.STATUS_MULTI_MATCH_RUNE
		multiMatched[configIdSource] = multiMatchedMatches

		return nil
	}

	for i := 1; i < len(remainingResultsPtr.CompareResults); i++ {
		result := remainingResultsPtr.CompareResults[i]
		if result.LeftId != currentSourceId {
			matchCount := i - firstIdx
			err := addMatchingMultiMatched(matchCount)
			if err != nil {
				return multiMatched, matchStatus, matchEntityMatches, err
			}

			currentSourceId = result.LeftId
			firstIdx = i
		}
	}
	matchCount := len(remainingResultsPtr.CompareResults) - firstIdx
	err := addMatchingMultiMatched(matchCount)
	if err != nil {
		return multiMatched, matchStatus, matchEntityMatches, err
	}

	return multiMatched, matchStatus, matchEntityMatches, nil

}

func skipConfigAction(matchParameters match.MatchParameters, action rune) bool {
	if len(matchParameters.SpecificActions) == 0 {
		return false
	}

	if slices.Contains(matchParameters.SpecificActions, action) {
		return false
	}

	return true

}

func addConfigResult(matchParameters match.MatchParameters, configProcessingPtr *match.MatchProcessing, matchEntityMatches *Module, configIdxToWriteSource *[]bool, result ConfigResultParam) error {
	action := result.action
	status := result.status
	sourceId := result.sourceI
	targetId := result.targetI
	var refMap map[string]interface{}
	var err error

	if skipConfigAction(matchParameters, action) {
		return nil
	}

	dataTargetJsonRaw := []byte{}

	if targetId >= 0 {
		refMap = (*configProcessingPtr.Target.RawMatchList.GetValues())[targetId].(map[string]interface{})
		dataTargetJsonRaw, err = json.Marshal(refMap[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey])
		if err != nil {
			return err
		}
	}

	dataSourceJsonRaw := []byte{}

	if sourceId >= 0 {
		refMap = (*configProcessingPtr.Source.RawMatchList.GetValues())[sourceId].(map[string]interface{})
		dataSourceJsonRaw, err = json.Marshal(refMap[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey])
		if err != nil {
			return err
		}
		if configIdxToWriteSource != nil {
			(*configIdxToWriteSource)[sourceId] = true
		}
	}

	entityListRaw, err := json.Marshal(refMap[rules.EntitiesListKey])
	if err != nil {
		return err
	}
	key_id := ""
	configName, configNameOk := refMap[rules.ConfigNameKey]
	configIdLocation, _ := getConfigTypeInfo(configProcessingPtr.GetConfigType())
	configId, _ := refMap[rules.DownloadedKey].(map[string]interface{})[configIdLocation].(string)
	scope, scopeOk := refMap[rules.DownloadedKey].(map[string]interface{})["scope"]

	if configNameOk {
		key_id = configName.(string)
		if scopeOk {
			key_id = key_id + " ( " + scope.(string) + " )"
		}
	} else if scopeOk {
		key_id = scope.(string)
	} else {
		key_id = refMap[rules.ConfigIdKey].(string)
	}

	(*matchEntityMatches)["data"] = append((*matchEntityMatches)["data"].(MatchEntityMatch), map[string]string{
		"status":      status,
		"key_id":      key_id,
		"data_main":   string(dataSourceJsonRaw),
		"data_target": string(dataTargetJsonRaw),
		"entity_list": string(entityListRaw),
		"monaco_type": configProcessingPtr.GetType(),
		"monaco_id":   configId,
	})

	(*matchEntityMatches)["stats"].(map[string]int)[status] += 1

	return nil
}

func printMultiMatchedSample(remainingResultsPtr *match.CompareResultList, configProcessingPtr *match.MatchProcessing) {
	multiMatchedCount := len(remainingResultsPtr.CompareResults)

	if multiMatchedCount <= 0 {
		return
	}

	var maxPrint int
	if multiMatchedCount > 10 {
		maxPrint = 10
	} else {
		maxPrint = multiMatchedCount
	}

	for i := 0; i < maxPrint; i++ {
		result := remainingResultsPtr.CompareResults[i]
		log.Debug("Left: %v, Source: %v, Target: %v", result,
			(*configProcessingPtr.Source.RawMatchList.GetValues())[result.LeftId],
			(*configProcessingPtr.Target.RawMatchList.GetValues())[result.RightId])
	}

}

type MatchOutputType struct {
	Type         string              `json:"type"`
	MatchKey     MatchKey            `json:"matchKey"`
	Matches      map[string]string   `json:"matches"`
	MultiMatched map[string][]string `json:"multiMatched"`
	UnMatched    []string            `json:"unmatched"`
	Exceed       []string            `json:"exceed"`
}

type MatchKey struct {
	Source ExtractionInfo `json:"source"`
	Target ExtractionInfo `json:"target"`
}

type ExtractionInfo struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type MatchPayload struct {
	Legend  MatchLegend    `json:"legend"`
	Modules []Module       `json:"modules"`
	Stats   map[string]int `json:"stats"`
}

type MatchLegend struct {
	Status map[string]string `json:"status"`
}

type MatchEntityMatch []interface{}

type Module map[string]interface{}

type MatchStatus struct {
	Source MatchStatusEnv
	Target MatchStatusEnv
}

type MatchStatusEnv struct {
	actionStatus []rune
	errorStatus  []rune
}

type ConfigResultParam struct {
	sourceI int
	targetI int
	status  string
	action  rune
}

const allConfigEntity = "all_configs"

func genOutputPayload(matchParameters match.MatchParameters, configProcessingPtr *match.MatchProcessing, remainingResultsPtr *match.CompareResultList, matchedConfigs *map[int]int, configsTypeInfo configTypeInfo, prevMatches MatchOutputType) (MatchOutputType, Module, []bool, error) {

	configIdxToWriteSource := make([]bool, len(*configProcessingPtr.Source.RawMatchList.GetValues()))

	multiMatchedMap, matchStatus, matchEntityMatches, err := genMultiMatchedMap(matchParameters, remainingResultsPtr, configProcessingPtr, configsTypeInfo, &configIdxToWriteSource, prevMatches)
	if err != nil {
		return MatchOutputType{}, Module{}, nil, err
	}

	configProcessingPtr.PrepareRemainingMatch(false, true, remainingResultsPtr)

	// TODO: Decide if we need a From/To for configs or only configs
	matchOutput := MatchOutputType{
		Type: configProcessingPtr.GetType(),
		MatchKey: MatchKey{
			Source: ExtractionInfo{
				//From: (*configProcessingPtr).Source.ConfigType.From,
				//To:   (*configProcessingPtr).Source.ConfigType.To,
			},
			Target: ExtractionInfo{
				//From: (*configProcessingPtr).Target.ConfigType.From,
				//To:   (*configProcessingPtr).Target.ConfigType.To,
			},
		},
		Matches:      make(map[string]string, len(*matchedConfigs)),
		MultiMatched: multiMatchedMap,
		UnMatched:    make([]string, 0, len(*configProcessingPtr.Source.CurrentRemainingMatch)),
		Exceed:       make([]string, len(*configProcessingPtr.Target.CurrentRemainingMatch)),
	}

	updateConfigResultParamList := make([]ConfigResultParam, 0)
	identicalConfigResultParamList := make([]ConfigResultParam, 0)

	for sourceI, targetI := range *matchedConfigs {

		areConfigsIdentical, err := areConfigsIdentical(configProcessingPtr, sourceI, targetI, configsTypeInfo)
		if err != nil {
			return MatchOutputType{}, Module{}, nil, err
		}

		var actionStatus rune
		if areConfigsIdentical {
			actionStatus = match.ACTION_IDENTICAL_RUNE
			identicalConfigResultParamList = append(identicalConfigResultParamList, ConfigResultParam{sourceI, targetI, string(actionStatus), actionStatus})
		} else {
			actionStatus = match.ACTION_UPDATE_RUNE
			updateConfigResultParamList = append(updateConfigResultParamList, ConfigResultParam{sourceI, targetI, string(actionStatus), actionStatus})
		}

		matchStatus.Source.actionStatus[sourceI] = actionStatus
		matchStatus.Target.actionStatus[targetI] = actionStatus

		matchOutput.Matches[(*configProcessingPtr.Source.RawMatchList.GetValues())[sourceI].(map[string]interface{})[rules.ConfigIdKey].(string)] =
			(*configProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})[rules.ConfigIdKey].(string)
	}

	for configSourceIdPrev, configTargetIdPrev := range prevMatches.Matches {
		_, foundId := matchOutput.Matches[configSourceIdPrev]

		if foundId {
			continue
		}

		matchOutput.Matches[configSourceIdPrev] = configTargetIdPrev
	}

	for _, result := range updateConfigResultParamList {
		err = addConfigResult(matchParameters, configProcessingPtr, &matchEntityMatches, &configIdxToWriteSource, result)
		if err != nil {
			return MatchOutputType{}, Module{}, nil, err
		}
	}

	for _, sourceI := range *configProcessingPtr.Source.CurrentRemainingMatch {
		configIdSource := (*configProcessingPtr.Source.RawMatchList.GetValues())[sourceI].(map[string]interface{})[rules.ConfigIdKey].(string)

		_, foundPrev := prevMatches.Matches[configIdSource]
		if foundPrev {
			continue
		}

		actionStatus := match.ACTION_ADD_RUNE
		matchStatus.Source.actionStatus[sourceI] = actionStatus

		err = addConfigResult(matchParameters, configProcessingPtr, &matchEntityMatches, &configIdxToWriteSource, ConfigResultParam{sourceI, -1, string(actionStatus), actionStatus})
		if err != nil {
			return MatchOutputType{}, Module{}, nil, err
		}
		matchOutput.UnMatched = append(matchOutput.UnMatched, configIdSource)
	}

	for idx, targetI := range *configProcessingPtr.Target.CurrentRemainingMatch {
		actionStatus := match.ACTION_DELETE_RUNE
		matchStatus.Target.actionStatus[targetI] = actionStatus

		err = addConfigResult(matchParameters, configProcessingPtr, &matchEntityMatches, &configIdxToWriteSource, ConfigResultParam{-1, targetI, string(actionStatus), actionStatus})
		if err != nil {
			return MatchOutputType{}, Module{}, nil, err
		}
		matchOutput.Exceed[idx] = (*configProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})[rules.ConfigIdKey].(string)

	}

	for _, result := range identicalConfigResultParamList {
		err = addConfigResult(matchParameters, configProcessingPtr, &matchEntityMatches, &configIdxToWriteSource, result)
		if err != nil {
			return MatchOutputType{}, Module{}, nil, err
		}
	}

	return matchOutput, matchEntityMatches, configIdxToWriteSource, nil
}

type sortableKeyedSlice []sortableKeyedItem

type sortableKeyedItem struct {
	key  string
	item interface{}
}

func (a sortableKeyedSlice) Len() int      { return len(a) }
func (a sortableKeyedSlice) Swap(i, j int) { a[i], a[j] = a[j], a[i] }
func (a sortableKeyedSlice) Less(i, j int) bool {
	return strings.Compare(a[i].key, a[j].key) <= -1
}

func areConfigsIdentical(configProcessingPtr *match.MatchProcessing, sourceI int, targetI int, configTypeInfo configTypeInfo) (bool, error) {

	sourceReplaced, err := replaceConfigIds(configProcessingPtr, sourceI, targetI, configTypeInfo)
	if err != nil {
		return false, err
	}

	areConfigsIdentical := reflect.DeepEqual(
		sourceReplaced.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey],
		(*configProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey],
	)

	if areConfigsIdentical {
		return areConfigsIdentical, nil
	}

	for key, sliceSourceInterface := range sourceReplaced.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey].(map[string]interface{}) {
		sliceSource, isSlice := sliceSourceInterface.([]interface{})

		if !(isSlice) {
			continue
		}

		if len(sliceSource) <= 0 {
			continue
		}

		sliceTargetInterface, ok := (*configProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey].(map[string]interface{})[key]
		if !(ok) {
			break
		}

		sliceTarget, ok := sliceTargetInterface.([]interface{})
		if !(ok) {
			break
		}

		if len(sliceSource) != len(sliceTarget) {
			break
		}

		orderedSliceSource, _ := reOrderSlice(sliceSourceInterface, false)
		orderedSliceTarget, _ := reOrderSlice(sliceTargetInterface, false)

		sourceReplaced.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey].(map[string]interface{})[key] = orderedSliceSource
		(*configProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey].(map[string]interface{})[key] = orderedSliceTarget

		areConfigsIdentical = reflect.DeepEqual(
			sourceReplaced.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey],
			(*configProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey],
		)

		if areConfigsIdentical {
			log.Debug("Sorting made it equal: %v", configProcessingPtr.GetType())
		}

	}

	return areConfigsIdentical, nil
}

func reOrderSlice(slice interface{}, returnMasterKey bool) (interface{}, string) {
	_, ok := slice.([]interface{})[0].(string)
	if ok {
		orderedSlice, masterKey, ok := reOrderSliceOfStrings(slice, returnMasterKey)
		if ok {
			return orderedSlice, masterKey
		}
	}

	orderedSlice, masterKey := reOrderSliceOfMaps(slice, returnMasterKey)
	return orderedSlice, masterKey
}

func reOrderSliceOfStrings(slice interface{}, returnMasterKey bool) (interface{}, string, bool) {
	stringSlice := make([]string, len(slice.([]interface{})))

	var ok bool
	for idx, stringInterface := range slice.([]interface{}) {
		stringSlice[idx], ok = stringInterface.(string)
		if !(ok) {
			return slice, "", false
		}
	}

	sort.Strings(stringSlice)
	masterKey := ""

	for idx, stringValue := range stringSlice {
		slice.([]interface{})[idx] = stringValue
		if returnMasterKey {
			masterKey += stringValue
		}
	}

	return slice, masterKey, true
}

func reOrderSliceOfMaps(slice interface{}, returnMasterKey bool) (interface{}, string) {
	keyedSlice := make(sortableKeyedSlice, len(slice.([]interface{})))

	for idx := range slice.([]interface{}) {
		keyedItem := sortableKeyedItem{
			key:  "",
			item: slice.([]interface{})[idx],
		}

		item, ok := keyedItem.item.(map[string]interface{})

		if ok {
			keyedItem.key, keyedItem.item = getItemKey(item, keyedItem.key)
		}
		keyedSlice[idx] = keyedItem
	}

	sort.Sort(keyedSlice)
	masterKey := ""

	for idx, item := range keyedSlice {
		slice.([]interface{})[idx] = item.item
		if returnMasterKey {
			masterKey += item.key
		}
	}

	return slice, masterKey
}

func getItemKey(item map[string]interface{}, itemKey string) (string, map[string]interface{}) {
	mapOfValues := map[string]string{}
	keys := []string{}

	for propertyKey, property := range item {
		propertyStringValue, ok := property.(string)
		if ok {
			keys = append(keys, propertyKey)
			mapOfValues[propertyKey] = propertyStringValue
		}

		subSlice, isSubSlice := property.([]interface{})
		if isSubSlice && len(subSlice) > 0 {
			orderedSubSlice, subMasterKey := reOrderSlice(subSlice, true)
			item[propertyKey] = orderedSubSlice

			keys = append(keys, propertyKey)
			mapOfValues[propertyKey] = subMasterKey
		}

		subMap, isSubMap := property.(map[string]interface{})
		if isSubMap && len(subMap) > 0 {
			subMapKey, subMapOrdered := getItemKey(subMap, "")
			item[propertyKey] = subMapOrdered

			keys = append(keys, propertyKey)
			mapOfValues[propertyKey] = subMapKey
		}
	}
	sort.Strings(keys)
	for _, key := range keys {
		itemKey += mapOfValues[key]
	}

	return itemKey, item
}

func readMatchesPrev(fs afero.Fs, matchParameters match.MatchParameters, configType string) (MatchOutputType, error) {

	if matchParameters.PrevResultDir == "" {
		return MatchOutputType{}, nil
	}

	sanitizedPrevResultDir := filepath.Clean(matchParameters.PrevResultDir)

	_, err := afero.Exists(fs, sanitizedPrevResultDir)
	if err != nil {
		return MatchOutputType{}, nil
	}

	sanitizedType := config.Sanitize(configType)
	fullMatchPathPrev := filepath.Join(sanitizedPrevResultDir, fmt.Sprintf("%s.json", sanitizedType))

	data, err := afero.ReadFile(fs, fullMatchPathPrev)
	if err != nil {
		return MatchOutputType{}, nil
	}

	if len(data) == 0 {
		return MatchOutputType{}, fmt.Errorf("file `%s` is empty", fullMatchPathPrev)
	}

	var prevResult MatchOutputType

	err = json.Unmarshal(data, &prevResult)
	if err != nil {
		return MatchOutputType{}, err
	}

	return prevResult, nil

}

func writeMatches(fs afero.Fs, configProcessingPtr *match.MatchProcessing, matchParameters match.MatchParameters, configTypeInfo configTypeInfo, configMatches MatchOutputType, configIdxToWriteSource []bool) error {
	sanitizedType := config.Sanitize(configTypeInfo.configTypeString)
	err := writeJsonMatchFile(fs, matchParameters.OutputDir, "dict", sanitizedType, configMatches)
	if err != nil {
		return err
	}

	err = writeTarFile(fs, matchParameters.OutputDir, false, configTypeInfo, configProcessingPtr.Source.RawMatchList.GetValues(), configIdxToWriteSource)
	if err != nil {
		return err
	}

	return nil

}

func writeTarFile(fs afero.Fs, outputDir string, isImport bool, configTypeInfo configTypeInfo, values *[]interface{}, configIdxToWriteSource []bool) error {
	cacheDir := "cache"
	if isImport {
		cacheDir += "_import"
	}

	startTime := time.Now()
	log.Debug("Writing cache %s", configTypeInfo.configTypeString)

	tarDir := path.Join(outputDir, cacheDir)
	sanitizedType := config.Sanitize(configTypeInfo.configTypeString)

	if configTypeInfo.configTypeString == "custom-service-nodejs" || configTypeInfo.configTypeString == "builtin:process-group.cloud-application-workload-detection" {
		log.Error("%s %s", configTypeInfo.configTypeString, "not exported properly by terraform, skipping it for now")
		return nil
	}

	err := fs.MkdirAll(tarDir, 0777)
	if err != nil {
		return err
	}

	tarFolder, _, err := tar.New(path.Join(tarDir, sanitizedType))
	if err != nil {
		return err
	}

	var getStubData tar.GetStubData = func(idx int) (api.Stub, []byte, bool, error) {

		conf := (*values)[idx]

		if configIdxToWriteSource != nil && !(configIdxToWriteSource[idx]) {
			name, _ := conf.(map[string]interface{})[rules.ConfigNameKey].(string)
			log.Debug("DO NOT WRITE??: ", name)
			return api.Stub{}, nil, true, nil
		}

		bytes, err := json.Marshal(conf)
		if err != nil {
			return api.Stub{}, nil, false, err
		}

		configId := replaceConfigs(&conf, &configTypeInfo)

		name, ok := conf.(map[string]interface{})[rules.ConfigNameKey].(string)
		if !ok {
			name = *configId
		}

		stub := api.Stub{
			ID:   *configId,
			Name: name,
		}

		if configTypeInfo.configTypeString == "dashboard" {
			stub.EntityID = conf.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey].(map[string]interface{})["dashboardMetadata"].(map[string]interface{})["owner"].(string)
			stub.Name = conf.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[rules.ValueKey].(map[string]interface{})["dashboardMetadata"].(map[string]interface{})["name"].(string)
		}

		return stub, bytes, false, nil
	}

	tarFolder.SaveAllCallback(len(*values), getStubData)

	log.Debug("Wrote   cache %s in %v", configTypeInfo.configTypeString, time.Since(startTime))

	return nil
}

func writeMatchPayload(fs afero.Fs, matchParameters match.MatchParameters, matchPayload MatchPayload) error {

	err := writeJsonMatchFile(fs, matchParameters.OutputDir, "UIPayload", "payload", matchPayload)
	if err != nil {
		return err
	}

	return nil

}

func writeJsonMatchFile(fs afero.Fs, outputDir string, subDir string, filename string, output any) error {
	jsonDir := path.Join(outputDir, subDir)

	err := fs.MkdirAll(jsonDir, 0777)
	if err != nil {
		return err
	}

	outputAsJson, err := json.Marshal(output)
	if err != nil {
		return err
	}

	fullMatchPath := filepath.Join(jsonDir, fmt.Sprintf("%s.json", filename))

	err = afero.WriteFile(fs, fullMatchPath, outputAsJson, 0664)

	if err != nil {
		return err
	}

	return nil

}
