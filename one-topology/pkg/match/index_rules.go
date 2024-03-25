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

package match

import (
	"runtime"
	"sort"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
)

// ByWeightTypeValue implements sort.Interface for []IndexRule based on
// the WeightTypeValue field.
type byWeightTypeValue []rules.IndexRuleType

func (a byWeightTypeValue) Len() int           { return len(a) }
func (a byWeightTypeValue) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byWeightTypeValue) Less(i, j int) bool { return a[j].WeightValue < a[i].WeightValue }

type IndexRuleMapGenerator struct {
	SelfMatch    bool
	baseRuleList rules.IndexRuleTypeList
}

func NewIndexRuleMapGenerator(selfMatch bool, ruleList rules.IndexRuleTypeList) *IndexRuleMapGenerator {
	i := new(IndexRuleMapGenerator)
	i.SelfMatch = selfMatch
	i.baseRuleList = ruleList
	return i
}

func (i *IndexRuleMapGenerator) genActiveList() []rules.IndexRuleType {

	activeList := make([]rules.IndexRuleType, 0, len(i.baseRuleList.RuleTypes))

	for idx, confType := range i.baseRuleList.RuleTypes {
		ruleType := rules.IndexRuleType{
			Key:         idx,
			IsSeed:      confType.IsSeed,
			SplitMatch:  confType.SplitMatch,
			WeightValue: confType.WeightValue,
			Rules:       make([]rules.IndexRule, 0, len(confType.Rules)),
		}
		for _, conf := range confType.Rules {
			if conf.SelfMatchDisabled && i.SelfMatch {
				continue
			}
			ruleType.Rules = append(ruleType.Rules, conf)
		}
		if len(ruleType.Rules) >= 1 {
			activeList = append(activeList, ruleType)
		}
	}

	return activeList
}

func (i *IndexRuleMapGenerator) genSortedActiveList() []rules.IndexRuleType {

	activeList := i.genActiveList()

	sort.Sort(byWeightTypeValue(activeList))

	return activeList
}

func runIndexRule(indexRule rules.IndexRule, indexRuleType rules.IndexRuleType, entityProcessingPtr *processing.MatchProcessing, resultListPtr *processing.CompareResultList) bool {

	countsTowardsMax := false

	sortedIndexSource := genSortedItemsIndex(indexRule, &(*entityProcessingPtr).Source)
	sortedIndexTarget := genSortedItemsIndex(indexRule, &(*entityProcessingPtr).Target)

	needsPostProcessing := compareIndexes(resultListPtr, sortedIndexSource, sortedIndexTarget, indexRule, indexRuleType)

	if needsPostProcessing {
		countsTowardsMax = false
	} else if len(sortedIndexSource) > 0 || len(sortedIndexTarget) > 0 {
		countsTowardsMax = true
	}

	return countsTowardsMax
}

func keepMatches(matchedEntities map[int]int, uniqueMatch []processing.CompareResult) map[int]int {
	for _, result := range uniqueMatch {
		_, found := matchedEntities[result.LeftId]

		if found {
			log.Error("Should never find multiple exact matches for an entity, %v", result)
		}

		matchedEntities[result.LeftId] = result.RightId
	}

	return matchedEntities
}

func (i *IndexRuleMapGenerator) RunIndexRuleAll(matchProcessingPtr *processing.MatchProcessing) (*processing.CompareResultList, *map[int]int) {
	matchedEntities := map[int]int{}
	remainingResultsPtr := &processing.CompareResultList{}

	ruleTypes := i.genSortedActiveList()

	log.Info("Type: %s -> source count %d and target count %d", matchProcessingPtr.GetType(),
		matchProcessingPtr.Source.RawMatchList.Len(), matchProcessingPtr.Target.RawMatchList.Len())

	allPostProcessLists := []processing.PostProcess{}

	for _, indexRuleType := range ruleTypes {
		resultListPtr := processing.NewCompareResultList(&indexRuleType)
		matchProcessingPtr.PrepareRemainingMatch(true, indexRuleType.IsSeed, remainingResultsPtr)

		maxMatchValue := 0
		for _, indexRule := range indexRuleType.Rules {
			countsTowardsMax := runIndexRule(indexRule, indexRuleType, matchProcessingPtr, resultListPtr)
			if countsTowardsMax {
				maxMatchValue += indexRule.WeightValue
			}
		}

		resultListPtr.MergeRemainingWeightType(remainingResultsPtr)

		uniqueMatchEntities := resultListPtr.ProcessMatches(indexRuleType.SplitMatch, maxMatchValue)
		remainingResultsPtr = resultListPtr

		matchProcessingPtr.AdjustremainingMatch(&uniqueMatchEntities)

		matchedEntities = keepMatches(matchedEntities, uniqueMatchEntities)

		allPostProcessLists = append(allPostProcessLists, resultListPtr.PostProcessList...)
		runtime.GC()
	}

	remainingResultsPtr.PostProcessList = allPostProcessLists

	log.Info("Type: %s -> source count %d and target count %d -> Matched: %d",
		matchProcessingPtr.GetType(), matchProcessingPtr.Source.RawMatchList.Len(),
		matchProcessingPtr.Target.RawMatchList.Len(), len(matchedEntities))

	return remainingResultsPtr, &matchedEntities
}
