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
	"sort"
	"sync"
	"time"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/errutils"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/download/classic"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/entities"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
	project "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/project/v2"
	"github.com/spf13/afero"
)

const SettingsIdKey = "objectId"

type RawConfigsList struct {
	Values *[]interface{}
}

// ByRawConfigId implements sort.Interface for []RawConfig] based on
// the ConfigId string field.
type ByRawConfigId []interface{}

func (a ByRawConfigId) Len() int      { return len(a) }
func (a ByRawConfigId) Swap(i, j int) { a[i], a[j] = a[j], a[i] }
func (a ByRawConfigId) Less(i, j int) bool {
	return (a[i].(map[string]interface{}))[rules.ConfigIdKey].(string) < (a[j].(map[string]interface{}))[rules.ConfigIdKey].(string)
}

func (r *RawConfigsList) Sort() {

	sort.Sort(ByRawConfigId(*r.GetValues()))

}

func (r *RawConfigsList) Len() int {

	return len(*r.GetValues())

}

func (r *RawConfigsList) GetValues() *[]interface{} {

	return r.Values

}

func unmarshalConfigs(configPerType []config.Config) (*RawConfigsList, error) {
	rawConfigsList := &RawConfigsList{
		Values: new([]interface{}),
	}

	if len(configPerType) <= 0 {
		return rawConfigsList, nil
	}

	content := configPerType[0].Template.Content()

	if content == "" {
		return rawConfigsList, nil
	}

	err := json.Unmarshal([]byte(content), rawConfigsList.Values)
	if err != nil {
		log.Error("Could not Unmarshal properly: %v on: \n%v", err, rawConfigsList.Values)
		return nil, err
	}

	return rawConfigsList, nil
}

func enhanceConfigs(rawConfigsList *RawConfigsList, configType config.Type, entityMatches entities.MatchOutputPerType) (*RawConfigsList, error) {

	configIdLocation, isSettings := getConfigTypeInfo(configType)

	var err error
	errs := []error{}
	mutex := sync.Mutex{}
	waitGroup := sync.WaitGroup{}
	waitGroup.Add(len(*rawConfigsList.Values))

	for i, conf := range *rawConfigsList.Values {
		go func(confIdx int, confInterface interface{}) {
			defer waitGroup.Done()
			confMap := confInterface.(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})

			var entities []interface{}
			var confInterfaceModified interface{}

			if entityMatches != nil {
				entities, confInterfaceModified, err = extractReplaceEntities(confMap, entityMatches)
				if err != nil {
					log.Error("Error with extractReplaceEntities: %v on: \n%v", err, confMap)
					mutex.Lock()
					errs = append(errs, err)
					mutex.Unlock()
					return
				}
				if confInterfaceModified != nil {
					confMap = confInterfaceModified.(map[string]interface{})
				}
			}

			uniqueConfKey := ""
			uniqueConfOk := false
			var classicNameValue interface{}
			settingsToV1IDOk := false
			var settingsToV1ID string

			if isSettings {

				// TO-DO: Re-write this to use a 'path' and handle everything automatically from a slice of configs.
				if configType.(config.SettingsType).SchemaId == "builtin:process.custom-process-monitoring-rule" {
					uniqueConfKey += confMap[rules.ValueKey].(map[string]interface{})["condition"].(map[string]interface{})["item"].(string)
					value, ok := confMap[rules.ValueKey].(map[string]interface{})["condition"].(map[string]interface{})["value"].(string)
					if ok {
						uniqueConfKey += "-"
						uniqueConfKey += value
					}
					uniqueConfOk = true
				} else if configType.(config.SettingsType).SchemaId == "builtin:process-group.advanced-detection-rule" {
					uniqueConfKey += confMap[rules.ValueKey].(map[string]interface{})["processDetection"].(map[string]interface{})["property"].(string)
					uniqueConfKey += "-"
					uniqueConfKey += confMap[rules.ValueKey].(map[string]interface{})["processDetection"].(map[string]interface{})["containedString"].(string)
					uniqueConfOk = true
				} else if configType.(config.SettingsType).SchemaId == "builtin:rum.ip-mappings" {
					uniqueConfKey, uniqueConfOk = confMap[rules.ValueKey].(map[string]interface{})["ip"].(string)
				} else if configType.(config.SettingsType).SchemaId == "builtin:anomaly-detection.metric-events" {
					value, ok := confMap[rules.ValueKey].(map[string]interface{})["eventEntityDimensionKey"].(string)
					if ok {
						uniqueConfKey += value
						uniqueConfOk = true
					}
					value, ok = confMap[rules.ValueKey].(map[string]interface{})["summary"].(string)
					if ok {
						uniqueConfKey += value
						uniqueConfOk = true
					}
				} else if configType.(config.SettingsType).SchemaId == "builtin:monitoredentities.generic.relation" {

					value, ok := confMap[rules.ValueKey].(map[string]interface{})["fromType"].(string)
					if ok {
						uniqueConfKey += value
						uniqueConfOk = true
					}
					value, ok = confMap[rules.ValueKey].(map[string]interface{})["toType"].(string)
					if ok {
						uniqueConfKey += value
						uniqueConfOk = true
					}
				} else {
					uniqueConfKey, uniqueConfOk = name(&confMap)
				}
			} else {

				if configType.(config.ClassicApiType).Api == "dashboard" {
					classicNameValue = confMap[rules.ValueKey].(map[string]interface{})["dashboardMetadata"].(map[string]interface{})["name"]
				} else {
					name, ok := confMap[rules.ValueKey].(map[string]interface{})["name"]
					if ok {
						classicNameValue = name
					} else if displayName, ok := confMap[rules.ValueKey].(map[string]interface{})["displayName"]; ok {
						classicNameValue = displayName
					}
				}
			}

			mutex.Lock()
			if confInterfaceModified != nil {
				(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.DownloadedKey] = confInterfaceModified
			}
			(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.ConfigIdKey] = confMap[configIdLocation].(string)
			(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.EntitiesListKey] = entities

			if uniqueConfOk {
				(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.ConfigNameKey] = uniqueConfKey
			} else if classicNameValue != nil {
				(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.ConfigNameKey] = classicNameValue
			}

			if (*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.ConfigNameKey] == nil ||
				(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.ConfigNameKey].(string) == "" {

				(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.ConfigNameKey] = confMap[configIdLocation].(string)
			}

			if settingsToV1IDOk {
				(*rawConfigsList.Values)[confIdx].(map[string]interface{})[rules.Settings20V1Id] = settingsToV1ID
			}
			mutex.Unlock()
		}(i, conf)

	}

	waitGroup.Wait()

	if len(errs) >= 1 {
		return nil, errutils.PrintAndFormatErrors(errs, "failed to enhance configs with required fields")
	}

	return rawConfigsList, err
}

func getConfigTypeInfo(configType config.Type) (string, bool) {
	var configIdLocation string
	isSettings := configType.ID() == config.SettingsTypeId
	if isSettings {
		configIdLocation = SettingsIdKey
	} else {
		configIdLocation = classic.ClassicIdKey
	}
	return configIdLocation, isSettings
}

func genConfigProcessing(fs afero.Fs, matchParameters match.MatchParameters, configPerTypeSource project.ConfigsPerType, configPerTypeTarget project.ConfigsPerType, configsType string, entityMatches entities.MatchOutputPerType) (*match.MatchProcessing, error) {

	startTime := time.Now()
	log.Debug("Enhancing %s", configsType)
	configObjectListSource := configPerTypeSource[configsType]

	//rawConfigsSource, err := convertConfigSliceToRawList(configPerTypeSource[configsType])
	rawConfigsSource, err := unmarshalConfigs(configObjectListSource)
	if err != nil {
		return nil, err
	}

	var sourceType config.Type
	if len(configObjectListSource) >= 1 {
		sourceType = configObjectListSource[0].Type

		rawConfigsSource, err = enhanceConfigs(rawConfigsSource, sourceType, entityMatches)
		if err != nil {
			return nil, err
		}
	}

	configObjectListTarget := configPerTypeTarget[configsType]

	//rawConfigsTarget, err := convertConfigSliceToRawList(configObjectListTarget)
	rawConfigsTarget, err := unmarshalConfigs(configObjectListTarget)
	if err != nil {
		return nil, err
	}
	var targetType config.Type
	if len(configObjectListTarget) >= 1 {
		targetType = configObjectListTarget[0].Type

		configTypeInfoTarget := configTypeInfo{configsType, configObjectListTarget[0].Type}

		rawConfigsTarget, err = enhanceConfigs(rawConfigsTarget, targetType, nil)
		if err != nil {
			return nil, err
		}
		writeTarFile(fs, matchParameters.OutputDir, true, configTypeInfoTarget, rawConfigsTarget.Values, nil)
	}

	log.Debug("Enhanced %s in %v", configsType, time.Since(startTime))

	return match.NewMatchProcessing(rawConfigsSource, sourceType, rawConfigsTarget, targetType), nil
}
