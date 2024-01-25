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
	"fmt"
	"sync"

	"github.com/dynatrace/dynatrace-configuration-as-code/internal/errutils"
	"github.com/dynatrace/dynatrace-configuration-as-code/internal/log"
	"github.com/dynatrace/dynatrace-configuration-as-code/internal/slices"
	config "github.com/dynatrace/dynatrace-configuration-as-code/pkg/config/v2"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/entities"
	project "github.com/dynatrace/dynatrace-configuration-as-code/pkg/project/v2"
	"github.com/spf13/afero"
)

type configTypeInfo struct {
	configTypeString string
	configType       config.Type
}

func MatchConfigs(fs afero.Fs, matchParameters match.MatchParameters, configPerTypeSource project.ConfigsPerType, configPerTypeTarget project.ConfigsPerType) ([]string, int, int, error) {
	configsSourceCount := 0
	configsTargetCount := 0
	stats := []string{fmt.Sprintf("%65s %10s %12s %10s %10s %10s", "Type", "Matched", "MultiMatched", "UnMatched", "Total", "Source")}
	errs := []error{}

	statusLegend := map[string]string{}
	for actionLabel, actionRune := range match.ActionMap {
		if skipConfigAction(matchParameters, actionRune) {
			continue
		}

		statusLegend[actionLabel] = string(actionRune)
	}

	statusLegend["Multi Matched"] = "M"

	matchPayload := MatchPayload{
		Legend: MatchLegend{
			Status: statusLegend,
		},
		Modules: []Module{},
		Stats:   map[string]int{},
	}

	typeCount := len(configPerTypeTarget)
	channel := make(chan configTypeInfo, typeCount)
	mutex := sync.Mutex{}
	waitGroup := sync.WaitGroup{}
	maxThreads := 10
	if maxThreads > typeCount {
		maxThreads = typeCount
	}
	waitGroup.Add(maxThreads)

	processType := func(configTypeInfo configTypeInfo) {

		if skipConfigType(matchParameters, configTypeInfo.configTypeString) {
			log.Debug("Skip Type: %s", configTypeInfo.configTypeString)
			return
		}

		log.Debug("Processing Type: %s", configTypeInfo.configTypeString)

		entityMatches, err := entities.LoadMatches(fs, matchParameters)
		if err != nil {
			mutex.Lock()
			errs = append(errs, err)
			mutex.Unlock()
			return
		}

		configProcessingPtr, err := genConfigProcessing(fs, matchParameters, configPerTypeSource, configPerTypeTarget, configTypeInfo.configTypeString, entityMatches)
		if err != nil {
			mutex.Lock()
			errs = append(errs, err)
			mutex.Unlock()
			return
		}

		configsSourceCountType := len(configProcessingPtr.Source.RemainingMatch)
		configsTargetCountType := len(configProcessingPtr.Target.RemainingMatch)

		prevMatches, err := readMatchesPrev(fs, matchParameters, configTypeInfo.configTypeString)
		if err != nil {
			return
		}

		configMatches, matchEntityMatches, configIdxToWriteSource, err := runRules(configProcessingPtr, matchParameters, configTypeInfo, prevMatches)
		if err != nil {
			mutex.Lock()
			errs = append(errs, fmt.Errorf("failed to run rules for type: %s, see error: %w", configTypeInfo.configTypeString, err))
			mutex.Unlock()
			return
		}

		err = writeMatches(fs, configProcessingPtr, matchParameters, configTypeInfo, configMatches, configIdxToWriteSource)
		if err != nil {
			mutex.Lock()
			errs = append(errs, fmt.Errorf("failed to persist matches of type: %s, see error: %w", configTypeInfo.configTypeString, err))
			mutex.Unlock()
			return
		}

		mutex.Lock()
		matchPayload.Modules = append(matchPayload.Modules, matchEntityMatches)
		for action, value := range matchEntityMatches["stats"].(map[string]int) {
			matchPayload.Stats[action] += value
		}
		configsSourceCount += configsSourceCountType
		configsTargetCount += configsTargetCountType
		stats = append(stats, fmt.Sprintf("%65s %10d %12d %10d %10d %10d", configTypeInfo.configTypeString, len(configMatches.Matches), len(configMatches.MultiMatched), len(configMatches.UnMatched), configsTargetCountType, configsSourceCountType))
		mutex.Unlock()

	}

	for i := 0; i < maxThreads; i++ {

		go func() {

			for {
				configTypeInfoLoop, ok := <-channel
				if !ok {
					waitGroup.Done()
					return
				}
				processType(configTypeInfoLoop)
			}
		}()

	}

	typeDone := map[string]bool{}

	for configsType, configObjectList := range configPerTypeTarget {
		if len(configObjectList) >= 1 {
			typeDone[configsType] = true
			channel <- configTypeInfo{configsType, configObjectList[0].Type}
		}
	}
	for configsType, configObjectList := range configPerTypeSource {
		if typeDone[configsType] {
			continue
		}
		if len(configObjectList) >= 1 {
			typeDone[configsType] = true
			channel <- configTypeInfo{configsType, configObjectList[0].Type}
		}
	}

	close(channel)
	waitGroup.Wait()

	if len(errs) >= 1 {
		return []string{}, 0, 0, errutils.PrintAndFormatErrors(errs, "failed to match configs with required fields")
	}

	runeLabelMap := match.GetRuneLabelMap()
	for action, total := range matchPayload.Stats {
		log.Info("%s: %v", runeLabelMap[action], total)
	}
	writeMatchPayload(fs, matchParameters, matchPayload)

	return stats, configsSourceCount, configsTargetCount, nil
}

func skipConfigType(matchParameters match.MatchParameters, configsType string) bool {
	if len(matchParameters.SpecificTypes) == 0 {
		return false
	}

	if slices.Contains(matchParameters.SpecificTypes, configsType) {
		return matchParameters.SkipSpecificTypes
	}

	return !matchParameters.SkipSpecificTypes

}
