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
	"fmt"
	"path/filepath"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/spf13/afero"
)

func genMultiMatchedMap(remainingResultsPtr *match.CompareResultList, entityProcessingPtr *match.MatchProcessing, prevMatches MatchOutputType) (map[string][]string, map[string]string) {

	printMultiMatchedSample(remainingResultsPtr, entityProcessingPtr)

	multiMatched := map[string][]string{}
	matchedByFirstSeen := map[string]string{}

	if len(remainingResultsPtr.CompareResults) <= 0 {
		return multiMatched, matchedByFirstSeen
	}

	firstIdx := 0
	currentId := remainingResultsPtr.CompareResults[0].LeftId

	addMatchingMultiMatched := func(matchCount int) {
		entityIdSource := (*entityProcessingPtr.Source.RawMatchList.GetValues())[currentId].(map[string]interface{})["entityId"].(string)
		var bestFirstSeen float64 = 0

		_, foundPrev := prevMatches.Matches[entityIdSource]
		if foundPrev {
			return
		}

		multiMatchedMatches := make([]string, matchCount)
		for j := 0; j < matchCount; j++ {
			compareResult := remainingResultsPtr.CompareResults[(j + firstIdx)]
			targetId := compareResult.RightId

			entityIdTarget := (*entityProcessingPtr.Target.RawMatchList.GetValues())[targetId].(map[string]interface{})["entityId"].(string)
			firstSeen := (*entityProcessingPtr.Target.RawMatchList.GetValues())[targetId].(map[string]interface{})["firstSeenTms"].(float64)

			if firstSeen > float64(bestFirstSeen) {
				bestFirstSeen = firstSeen
				matchedByFirstSeen[entityIdSource] = entityIdTarget
			}

			multiMatchedMatches[j] = entityIdTarget
		}
		multiMatched[entityIdSource] = multiMatchedMatches
	}

	for i := 1; i < len(remainingResultsPtr.CompareResults); i++ {
		result := remainingResultsPtr.CompareResults[i]
		if result.LeftId != currentId {
			matchCount := i - firstIdx
			addMatchingMultiMatched(matchCount)

			currentId = result.LeftId
			firstIdx = i
		}
	}
	matchCount := len(remainingResultsPtr.CompareResults) - firstIdx
	addMatchingMultiMatched(matchCount)

	reverseMatches := map[string]string{}
	blockedSource := map[string]bool{}

	for entityIdSource, entityIdTarget := range matchedByFirstSeen {
		entityIdSourceReverse, foundReverse := reverseMatches[entityIdTarget]
		if foundReverse {
			blockedSource[entityIdSourceReverse] = true
			blockedSource[entityIdSource] = true
			continue
		}

		reverseMatches[entityIdTarget] = entityIdSource
	}

	matchedByFirstSeenFinal := map[string]string{}
	for entityIdSource, entityIdTarget := range matchedByFirstSeen {
		blocked, found := blockedSource[entityIdSource]
		if found {
			if blocked {
				continue
			}
		}
		matchedByFirstSeenFinal[entityIdSource] = entityIdTarget
	}

	return multiMatched, matchedByFirstSeenFinal

}

func printMultiMatchedSample(remainingResultsPtr *match.CompareResultList, entityProcessingPtr *match.MatchProcessing) {
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
			(*entityProcessingPtr.Source.RawMatchList.GetValues())[result.LeftId],
			(*entityProcessingPtr.Target.RawMatchList.GetValues())[result.RightId])
	}

}

type MatchOutputPerType map[string]MatchOutputType

type MatchOutputType struct {
	Type              string                        `json:"type"`
	MatchKey          MatchKey                      `json:"matchKey"`
	Matches           map[string]string             `json:"matches"`
	MultiMatched      map[string][]string           `json:"multiMatched"`
	UnMatched         []string                      `json:"unmatched"`
	PostProcessSource map[string]*PostProcessOutput `json:"postProcessSource"`
	PostProcessTarget map[string]*PostProcessOutput `json:"postProcessTarget"`
}

type MatchKey struct {
	Source ExtractionInfo `json:"source"`
	Target ExtractionInfo `json:"target"`
}

type ExtractionInfo struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type PostProcessOutput struct {
	IndexValues []string `json:"indexValues"`
	TotalWeight int      `json:"totalWeight"`
	IDs         []string
}

func (me *MatchOutputType) calcMultiMatched() int {
	multiMatched := len(me.MultiMatched)
	for _, postProcess := range me.PostProcessSource {
		multiMatched += len(postProcess.IDs)
	}

	return multiMatched
}
func genOutputPayload(entityProcessingPtr *match.MatchProcessing, remainingResultsPtr *match.CompareResultList, matchedEntities *map[int]int, prevMatches MatchOutputType) MatchOutputType {

	multiMatchedMap, matchedByFirstSeen := genMultiMatchedMap(remainingResultsPtr, entityProcessingPtr, prevMatches)
	entityProcessingPtr.PrepareRemainingMatch(false, true, remainingResultsPtr)

	matchOutput := MatchOutputType{
		Type: entityProcessingPtr.GetType(),
		MatchKey: MatchKey{
			Source: ExtractionInfo{
				From: (*entityProcessingPtr).Source.ConfigType.(config.EntityType).From,
				To:   (*entityProcessingPtr).Source.ConfigType.(config.EntityType).To,
			},
			Target: ExtractionInfo{
				From: (*entityProcessingPtr).Target.ConfigType.(config.EntityType).From,
				To:   (*entityProcessingPtr).Target.ConfigType.(config.EntityType).To,
			},
		},
		Matches:           make(map[string]string, len(*matchedEntities)),
		MultiMatched:      multiMatchedMap,
		UnMatched:         make([]string, 0, len(*entityProcessingPtr.Source.CurrentRemainingMatch)),
		PostProcessSource: map[string]*PostProcessOutput{},
		PostProcessTarget: map[string]*PostProcessOutput{},
	}

	reverseMatches := map[string]string{}

	var isAlreadyMatched = func(entityIdSource string, entityIdTarget string) bool {

		_, foundId := matchOutput.Matches[entityIdSource]

		if foundId {
			return true
		}

		_, foundReverse := reverseMatches[entityIdTarget]
		if foundReverse {
			return true
		}

		reverseMatches[entityIdTarget] = entityIdSource

		return false
	}

	// First, current perfect matches
	for sourceI, targetI := range *matchedEntities {
		entityIdSource := (*entityProcessingPtr.Source.RawMatchList.GetValues())[sourceI].(map[string]interface{})["entityId"].(string)
		entityIdTarget := (*entityProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})["entityId"].(string)

		if isAlreadyMatched(entityIdSource, entityIdTarget) {
			continue
		}

		matchOutput.Matches[entityIdSource] = entityIdTarget

	}

	// Then, previously matched
	for entityIdSourcePrev, entityIdTargetPrev := range prevMatches.Matches {
		if isAlreadyMatched(entityIdSourcePrev, entityIdTargetPrev) {
			continue
		}

		matchOutput.Matches[entityIdSourcePrev] = entityIdTargetPrev

		_, found := matchOutput.MultiMatched[entityIdSourcePrev]
		if found {
			delete(matchOutput.MultiMatched, entityIdSourcePrev)
		}
	}

	// Last, matched using most recent first seen date
	for entityIdSourceFirstSeen, entityIdTargetFirstSeen := range matchedByFirstSeen {
		if isAlreadyMatched(entityIdSourceFirstSeen, entityIdTargetFirstSeen) {
			continue
		}

		matchOutput.Matches[entityIdSourceFirstSeen] = entityIdTargetFirstSeen

		_, found := matchOutput.MultiMatched[entityIdSourceFirstSeen]
		if found {
			delete(matchOutput.MultiMatched, entityIdSourceFirstSeen)
		}
	}

	isInLeftMap := func(postProcess match.PostProcess, entityIdx int) bool {
		return postProcess.LeftMap[entityIdx]
	}

	for _, sourceI := range *entityProcessingPtr.Source.CurrentRemainingMatch {
		entityIdSource := (*entityProcessingPtr.Source.RawMatchList.GetValues())[sourceI].(map[string]interface{})["entityId"].(string)

		_, foundPrev := prevMatches.Matches[entityIdSource]
		if foundPrev {
			continue
		}

		hasPostProcessData := handlePostProcess(remainingResultsPtr, &matchOutput.PostProcessSource, sourceI, entityIdSource, isInLeftMap)

		if hasPostProcessData {
			continue
		}

		matchOutput.UnMatched = append(matchOutput.UnMatched, entityIdSource)
	}

	isInRightMap := func(postProcess match.PostProcess, entityIdx int) bool {
		return postProcess.RightMap[entityIdx]
	}

	for _, targetI := range *entityProcessingPtr.Target.CurrentRemainingMatch {
		entityIdTarget := (*entityProcessingPtr.Target.RawMatchList.GetValues())[targetI].(map[string]interface{})["entityId"].(string)

		handlePostProcess(remainingResultsPtr, &matchOutput.PostProcessTarget, targetI, entityIdTarget, isInRightMap)
	}

	return matchOutput
}

func handlePostProcess(remainingResultsPtr *match.CompareResultList, postProcessOutput *map[string]*PostProcessOutput, entityIdx int, entityId string, isInMap func(match.PostProcess, int) bool) bool {
	postProcessIdxList := []int{}
	postProcessId := ""
	for postProcessIdx, postProcess := range remainingResultsPtr.PostProcessList {
		if isInMap(postProcess, entityIdx) {
			postProcessIdxList = append(postProcessIdxList, postProcessIdx)
			if postProcessId != "" {
				postProcessId += "|"
			}
			postProcessId += fmt.Sprint(postProcessIdx)
		}
	}

	hasPostProcessData := len(postProcessIdxList) > 0

	if hasPostProcessData {
		postProcessOutputLocal, postProcessFound := (*postProcessOutput)[postProcessId]

		if postProcessFound {
			// pass
		} else {
			postProcessOutputLocal = &PostProcessOutput{
				IndexValues: []string{},
				TotalWeight: 0,
				IDs:         []string{},
			}

			for _, postProcessIdx := range postProcessIdxList {
				postProcess := remainingResultsPtr.PostProcessList[postProcessIdx]
				postProcessOutputLocal.TotalWeight += postProcess.Rule.GetWeightValue()
				postProcessOutputLocal.IndexValues = append(postProcessOutputLocal.IndexValues, postProcess.IndexValue)
			}
		}

		postProcessOutputLocal.IDs = append(postProcessOutputLocal.IDs, entityId)

		(*postProcessOutput)[postProcessId] = postProcessOutputLocal

	}

	return hasPostProcessData
}

func readMatchesPrev(fs afero.Fs, matchParameters match.MatchParameters, entitiesType string) (MatchOutputType, error) {

	if matchParameters.PrevResultDir == "" {
		return MatchOutputType{}, nil
	}

	sanitizedPrevResultDir := filepath.Clean(matchParameters.PrevResultDir)

	_, err := afero.Exists(fs, sanitizedPrevResultDir)
	if err != nil {
		return MatchOutputType{}, nil
	}

	return readMatchesFile(fs, sanitizedPrevResultDir, entitiesType)

}

func readMatchesCurrent(fs afero.Fs, matchParameters match.MatchParameters, entitiesType string) (MatchOutputType, error) {
	sanitizedOutputDir := filepath.Clean(matchParameters.OutputDir)
	_, err := afero.Exists(fs, sanitizedOutputDir)
	if err != nil {
		return MatchOutputType{}, nil
	}

	return readMatchesFile(fs, sanitizedOutputDir, entitiesType)

}

func readMatchesFile(fs afero.Fs, sanitizedDir string, entitiesType string) (MatchOutputType, error) {
	matchPath := getFullMatchPath(sanitizedDir, entitiesType)

	data, err := afero.ReadFile(fs, matchPath)
	if err != nil {
		return MatchOutputType{}, nil
	}

	if len(data) == 0 {
		return MatchOutputType{}, fmt.Errorf("file `%s` is empty", matchPath)
	}

	var prevResult MatchOutputType

	err = json.Unmarshal(data, &prevResult)
	if err != nil {
		return MatchOutputType{}, err
	}

	return prevResult, nil
}

func writeMatches(fs afero.Fs, matchParameters match.MatchParameters, entitiesType string, output MatchOutputType) error {

	sanitizedOutputDir := filepath.Clean(matchParameters.OutputDir)

	if sanitizedOutputDir != "." {
		err := fs.MkdirAll(sanitizedOutputDir, 0777)
		if err != nil {
			return err
		}
	}

	outputAsJson, err := json.Marshal(output)

	if err != nil {
		return err
	}

	matchPath := getFullMatchPath(sanitizedOutputDir, entitiesType)

	err = afero.WriteFile(fs, matchPath, outputAsJson, 0664)

	if err != nil {
		return err
	}

	return nil

}

func getFullMatchPath(sanitizedDir string, entitiesType string) string {
	sanitizedType := config.Sanitize(entitiesType)
	fullMatchPath := filepath.Join(sanitizedDir, fmt.Sprintf("%s.json", sanitizedType))

	return fullMatchPath
}
