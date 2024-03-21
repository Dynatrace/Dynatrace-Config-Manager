/**
* @license
* Copyright 2020 Dynatrace LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

package configs

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/entities"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
	"github.com/spf13/afero"
)

var entityExtractionRegex = regexp.MustCompile(`(((?:[A-Z]+_)?(?:[A-Z]+_)?(?:[A-Z]+_)?[A-Z]+)-[0-9A-Z]{16})`)

var main_object_key_regex_list = []*regexp.Regexp{
	regexp.MustCompile(`(^[Nn]ame$)`),
	regexp.MustCompile(`(^[Dd]isplay[Nn]ame$)`),
	regexp.MustCompile(`(^[Kk]ey$)`),
	regexp.MustCompile(`(^[Ss]ummary$)`),
	regexp.MustCompile(`(^[Ll]abel$)`),
	regexp.MustCompile(`(^[Tt]itle$)`),
	regexp.MustCompile(`(^[Pp]attern$)`),
	regexp.MustCompile(`(^[Rr]ule[Nn]ame$)`),
	regexp.MustCompile(`(^[Rr]ule$)`),
	regexp.MustCompile(`(^[Ii]dentifier$)`),
	regexp.MustCompile(`(^.*[Nn]ame$)`),
	regexp.MustCompile(`(^.*[Kk]ey$)`),
	regexp.MustCompile(`(^.*[Ss]ummary$)`),
	regexp.MustCompile(`(^.*[Ll]abel$)`),
	regexp.MustCompile(`(^.*[Tt]itle$)`),
	regexp.MustCompile(`(^.*[Pp]attern$)`),
	regexp.MustCompile(`(^.*[Rr]ule$)`),
	regexp.MustCompile(`(^.*[Ii]dentifier$)`),
}

func name(v *map[string]interface{}) (string, bool) {

	for _, regex := range main_object_key_regex_list {
		uniqueConfKey, uniqueConfOk := name_internal((*v)["value"], regex)
		if uniqueConfOk {
			return uniqueConfKey, uniqueConfOk
		}
	}

	return "", false
}

func name_internal(v interface{}, regex *regexp.Regexp) (string, bool) {

	for key, value := range v.(map[string]interface{}) {

		mapInterface, mapInterfaceOk := value.(map[string]interface{})

		if mapInterfaceOk {
			uniqueConfKey, uniqueConfOk := name_internal(mapInterface, regex)
			if uniqueConfOk {
				return uniqueConfKey, uniqueConfOk
			}

		} else {

			if regex.Match([]byte(key)) {
				stringValue, ok := value.(string)
				if ok && stringValue != "" {
					return value.(string), true
				}
			}
		}
	}

	return "", false
}

func extractReplaceEntities(confInterface map[string]interface{}, entityMatches entities.MatchOutputPerType) ([]interface{}, interface{}, error) {
	rawJson, err := json.Marshal(confInterface)
	if err != nil {
		return nil, nil, err
	}

	matches := entityExtractionRegex.FindAll(rawJson, -1)

	jsonString := string(rawJson)

	matchesStrings := make([]interface{}, len(matches))

	wasModified := false

	for i, bytes := range matches {
		entityId := string(bytes)
		matchesStrings[i] = entityId

		entityMatchType, ok := entityMatches[string(bytes[0:(len(bytes)-17)])]
		if ok {
			entityMatch, ok := entityMatchType.Matches[entityId]
			if ok {
				if entityMatch != entityId {
					jsonString = strings.ReplaceAll(jsonString, entityId, entityMatch)
					matchesStrings[i] = entityMatch
					wasModified = true
				}
			}
		}
	}

	if wasModified {
		var confInterfaceModified interface{}
		json.Unmarshal([]byte(jsonString), &confInterfaceModified)
		return matchesStrings, confInterfaceModified, nil
	}

	return matchesStrings, nil, nil

}

func runReplacements(confInterface *map[string]interface{}, replacements *map[string]map[string]string, settingsType *string) (interface{}, error) {
	if *settingsType == "dashboard" || *settingsType == "dashboard-sharing" {
		return replaceDashboardOwners(confInterface, replacements, settingsType)
	}

	return nil, nil
}

func replaceDashboardOwners(confInterface *map[string]interface{}, replacements *map[string]map[string]string, settingsType *string) (interface{}, error) {
	dashboardReplacement, exists := (*replacements)["dashboard"]

	if exists {
		if *settingsType == "dashboard" {
			return replaceDashboard(confInterface, dashboardReplacement)
		}

		if *settingsType == "dashboard-sharing" {
			return replaceDashboardSharing(confInterface, dashboardReplacement)
		}
	}

	return nil, nil

}

func replaceDashboard(confInterface *map[string]interface{}, dashboardReplacement map[string]string) (interface{}, error) {
	owner := (*confInterface)[rules.ValueKey].(map[string]interface{})["dashboardMetadata"].(map[string]interface{})["owner"].(string)

	newOwner, exists := dashboardReplacement[owner]

	if exists {
		(*confInterface)[rules.ValueKey].(map[string]interface{})["dashboardMetadata"].(map[string]interface{})["owner"] = newOwner

		return *confInterface, nil
	}

	return nil, nil

}

func replaceDashboardSharing(confInterface *map[string]interface{}, dashboardReplacement map[string]string) (interface{}, error) {
	permissionList, exists := (*confInterface)[rules.ValueKey].(map[string]interface{})["permissions"].([]interface{})

	if exists {
		// pass
	} else {
		return nil, nil
	}

	wasModified := false

	for idx, permissionInterface := range permissionList {
		permissionType, exists := permissionInterface.(map[string]interface{})["type"].(string)

		if exists && permissionType == "USER" {
			// pass
		} else {
			continue
		}

		permissionId, exists := permissionInterface.(map[string]interface{})["id"].(string)

		if exists {
			// pass
		} else {
			continue
		}

		newId, exists := dashboardReplacement[permissionId]

		if exists {
			(*confInterface)[rules.ValueKey].(map[string]interface{})["permissions"].([]interface{})[idx].(map[string]interface{})["id"] = newId
			wasModified = true
		}

	}

	if wasModified {
		return *confInterface, nil
	}

	return nil, nil

}

func replaceConfigIds(configProcessingPtr *processing.MatchProcessing, sourceI int, targetI int, configTypeInfo configTypeInfo) (interface{}, error) {
	configIdLocation, _ := getConfigTypeInfo(configTypeInfo.configType)

	configId := (*configProcessingPtr.Source.RawMatchList.GetValuesConfig())[sourceI].(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[configIdLocation].(string)
	if configId == "" {
		log.Error("CONFIG ID MISSING!!!")
	}
	configIdTarget := (*configProcessingPtr.Target.RawMatchList.GetValuesConfig())[targetI].(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[configIdLocation].(string)

	bytes, err := json.Marshal((*configProcessingPtr.Source.RawMatchList.GetValuesConfig())[sourceI])
	if err != nil {
		return nil, err
	}

	if configIdTarget != configId {

		modifiedString := strings.ReplaceAll(string(bytes), configId, configIdTarget)

		var resultInterface interface{}
		json.Unmarshal([]byte(modifiedString), &resultInterface)
		return resultInterface, nil

	}

	return (*configProcessingPtr.Source.RawMatchList.GetValuesConfig())[sourceI], nil
}

func replaceConfigs(confPtr *interface{}, configTypeInfo *configTypeInfo) *string {

	configIdLocation, _ := getConfigTypeInfo(configTypeInfo.configType)

	configId := (*confPtr).(map[string]interface{})[rules.DownloadedKey].(map[string]interface{})[configIdLocation].(string)
	if configId == "" {
		log.Error("CONFIG ID MISSING!!!")
	}

	return &configId
}

func checkAndReplace(valueKey *map[string]interface{}, key, configId, configIdTarget string) {
	value, ok := (*valueKey)[key]
	if ok && value == configId {
		log.Error("FOUND ID IN THE VALUE TO CHANGE!!!: ", value, "\n", configIdTarget)
		(*valueKey)[key] = configIdTarget
	}
}

func readReplacements(fs afero.Fs, matchParameters match.MatchParameters) (map[string]map[string]string, error) {

	replacements := map[string]map[string]string{}

	if matchParameters.ReplacementsDir == "" {
		return nil, nil
	}

	sanitizedReplacementsDir := filepath.Clean(matchParameters.ReplacementsDir)

	_, err := afero.Exists(fs, sanitizedReplacementsDir)
	if err != nil {
		return nil, err
	}

	err = afero.Walk(fs, sanitizedReplacementsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Error(fmt.Sprint(err))
			return nil
		}

		if info.IsDir() {
			replacementType := filepath.Base(path)

			replacementTypeMap := make(map[string]string)

			files, err := afero.ReadDir(fs, path)
			if err != nil {
				log.Error(fmt.Sprint(err))
				return nil
			}

			for _, file := range files {
				if strings.HasSuffix(file.Name(), ".csv") {

					csvPath := filepath.Join(path, file.Name())
					content, err := afero.ReadFile(fs, csvPath)
					if err != nil {
						log.Error(fmt.Sprint(err))
						continue
					}

					content = removeBOM(content)

					lines := strings.Split(string(content), "\n")

					for _, line := range lines {
						columns := strings.Split(strings.TrimSpace(line), ",")

						if len(columns) >= 2 {
							key := strings.TrimSpace(columns[0])
							value := strings.TrimSpace(columns[1])

							if key != "" && value != "" {
								replacementTypeMap[key] = value
							}

						}
					}
				}
			}

			if len(replacementTypeMap) > 0 {
				replacements[replacementType] = replacementTypeMap
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return replacements, nil

}

func removeBOM(content []byte) []byte {
	if utf8.Valid(content) && len(content) >= 3 &&
		content[0] == 0xEF && content[1] == 0xBB && content[2] == 0xBF {
		content = content[3:]
	}
	return content
}
