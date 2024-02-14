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

package entities

import (
	"encoding/json"
	"path/filepath"
	"sync"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/spf13/afero"
)

var mutex = new(sync.Mutex)
var matchOutputPerType MatchOutputPerType = nil

func LoadMatches(fs afero.Fs, matchParameters match.MatchParameters) (MatchOutputPerType, error) {

	mutex.Lock()
	defer mutex.Unlock()

	if matchOutputPerType == nil {
		// pass
	} else {
		return matchOutputPerType, nil
	}

	filesInFolder, err := afero.ReadDir(fs, matchParameters.EntitiesMatchDir)
	if err != nil {
		return nil, err
	}

	matchOutputPerType = MatchOutputPerType{}

	for _, file := range filesInFolder {
		filename := file.Name()

		if file.IsDir() {
			continue
		}

		data, err := afero.ReadFile(fs, filepath.Join(matchParameters.EntitiesMatchDir, filename))
		if err != nil {
			return nil, err
		}

		matchOutputType := MatchOutputType{}
		err = json.Unmarshal(data, &matchOutputType)

		entityType := matchOutputType.Type

		if len(matchOutputType.Matches) > 0 {
			for entityId := range matchOutputType.Matches {
				entityType = entityId[0:(len(entityId) - 17)]
				break
			}
		}

		if err != nil {

			return nil, err
		}
		addMatches(entityType, matchOutputType)

	}

	return matchOutputPerType, nil

}

func addMatches(entityType string, matchOutputType MatchOutputType) {
	previousMatchOutputType, exists := matchOutputPerType[entityType]

	if exists {
		for entityIdSource, entityIdTarget := range matchOutputType.Matches {
			previousIdTarget, exists := previousMatchOutputType.Matches[entityIdSource]
			if exists {
				if previousIdTarget == entityIdTarget {
					// pass
				} else {
					log.Warn("[LoadMatches] Duplicate Matching for %s, matches with %s and %s", entityIdSource, entityIdTarget, previousIdTarget)
				}
			} else {
				previousMatchOutputType.Matches[entityIdSource] = entityIdTarget
			}
		}

		matchOutputPerType[entityType] = previousMatchOutputType

	} else {
		matchOutputType.Type = entityType
		matchOutputPerType[entityType] = matchOutputType
	}
}

func AddMatches(configBasedMatches map[string]string) {

	mutex.Lock()
	defer mutex.Unlock()

	matchesPerType := map[string]map[string]string{}

	if len(configBasedMatches) > 0 {
		for entityIdSource, entityIdTarget := range configBasedMatches {
			entityType := entityIdSource[0:(len(entityIdSource) - 17)]

			_, exists := matchesPerType[entityType]
			if exists {
				// pass
			} else {
				matchesPerType[entityType] = map[string]string{}
			}

			matchesPerType[entityType][entityIdSource] = entityIdTarget
		}
	}

	for entityType, matches := range matchesPerType {

		matchOutputType := MatchOutputType{
			Type:    entityType,
			Matches: matches,
		}

		addMatches(entityType, matchOutputType)

	}

}
