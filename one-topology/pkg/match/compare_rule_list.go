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
	"sort"

	"github.com/dynatrace/dynatrace-configuration-as-code/internal/log"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/rules"
)

type CompareResultList struct {
	RuleType        rules.RuleType
	CompareResults  []CompareResult
	PostProcessList []PostProcess
}

type PostProcess struct {
	RuleType   rules.RuleType
	Rule       rules.Rule
	IndexValue string
	LeftMap    map[int]bool
	RightMap   map[int]bool
}

func NewCompareResultList(ruleType rules.RuleType) *CompareResultList {
	i := new(CompareResultList)
	i.RuleType = ruleType
	i.CompareResults = []CompareResult{}
	i.PostProcessList = []PostProcess{}
	return i
}

func newReversedCompareResultList(sourceList *CompareResultList) *CompareResultList {
	i := new(CompareResultList)
	size := len(sourceList.CompareResults)
	i.CompareResults = make([]CompareResult, size)
	resI := 0

	for _, result := range sourceList.CompareResults {
		i.CompareResults[resI] = CompareResult{result.RightId, result.LeftId, result.Weight}
		resI++
	}

	if resI != size {
		log.Error("Did not reverse properly!")
	}
	return i
}

func (i *CompareResultList) AddResult(entityIdSource int, entityIdTarget int, WeightValue int) {
	i.CompareResults = append(i.CompareResults, CompareResult{entityIdSource, entityIdTarget, WeightValue})
}

func (i *CompareResultList) addPostProcess(ruleType rules.RuleType, rule rules.Rule, leftList []int, rightList []int, indexValue string) {

	postProcess := PostProcess{
		RuleType:   ruleType,
		Rule:       rule,
		IndexValue: indexValue,
		LeftMap:    make(map[int]bool, len(leftList)),
		RightMap:   make(map[int]bool, len(rightList)),
	}

	for _, id := range leftList {
		postProcess.LeftMap[id] = true
	}
	for _, id := range rightList {
		postProcess.RightMap[id] = true
	}

	i.PostProcessList = append(i.PostProcessList, postProcess)
}

func (i *CompareResultList) sortTopMatches() {

	sort.Sort(ByTopMatch(i.CompareResults))

}

func (i *CompareResultList) keepTopMatchesOnly() {

	if len(i.CompareResults) == 0 {
		return
	}

	i.sortTopMatches()

	topMatchesResults := []CompareResult{}
	prevTop := i.CompareResults[0]

	for _, result := range i.CompareResults {

		if result.LeftId == prevTop.LeftId {
			if result.Weight != prevTop.Weight {
				continue
			}
		} else {
			prevTop = result
		}

		topMatchesResults = append(topMatchesResults, result)

	}

	i.CompareResults = topMatchesResults

}

func (i *CompareResultList) reduceBothForwardAndBackward() *CompareResultList {

	i.keepTopMatchesOnly()

	reverseResults := newReversedCompareResultList(i)
	reverseResults.keepTopMatchesOnly()

	i.CompareResults = newReversedCompareResultList(reverseResults).CompareResults

	return reverseResults
}

func (i *CompareResultList) sort() {

	sort.Sort(ByLeftRight(i.CompareResults))

}

func (i *CompareResultList) getUniqueMatchItems() []CompareResult {

	if len(i.CompareResults) == 0 {
		return []CompareResult{}
	}

	i.sort()

	uniqueMatchItems := []CompareResult{}

	prevResult := i.CompareResults[0]
	prevTotalSeen := 1

	extractUniqueMatch := func() {
		if prevTotalSeen == 1 {
			uniqueMatchItems = append(uniqueMatchItems, prevResult)
		}
	}

	for _, compareResult := range i.CompareResults[1:] {
		if compareResult.LeftId == prevResult.LeftId {
			prevTotalSeen += 1
		} else {
			extractUniqueMatch()
			prevResult = compareResult
			prevTotalSeen = 1
		}
	}
	extractUniqueMatch()

	return uniqueMatchItems
}

func (i *CompareResultList) sumMatchWeightValues(splitMatch bool, maxMatchValue int, doPostProcess bool) {

	if len(i.CompareResults) <= 1 {
		return
	}

	i.sort()

	summedMatchResults := make([]CompareResult, 0, len(i.CompareResults))
	prevTotal := i.CompareResults[0]

	aI := 0
	bI := 1

	var addRecord = func() {
		if splitMatch && prevTotal.Weight < maxMatchValue {
			return
		}

		keepRecord := true

		if doPostProcess {
			keepRecord = i.postProcess(&prevTotal)
		}

		if keepRecord {
			summedMatchResults = append(summedMatchResults, prevTotal)
		}
	}

	for bI < len(i.CompareResults) {
		a := i.CompareResults[aI]
		b := i.CompareResults[bI]

		if a.areIdsEqual(b) {
			prevTotal.Weight += b.Weight
		} else {
			addRecord()
			prevTotal = b
		}

		aI++
		bI++
	}

	addRecord()

	i.CompareResults = summedMatchResults

}

func (i *CompareResultList) postProcess(prevTotal *CompareResult) bool {
	keepRecord := true

	for _, postProcess := range i.PostProcessList {
		if postProcess.LeftMap[prevTotal.LeftId] && postProcess.RightMap[prevTotal.RightId] {
			prevTotal.Weight += postProcess.Rule.GetWeightValue()
		} else if postProcess.RuleType.IsSplitMatch() {
			keepRecord = false
		}
	}

	return keepRecord
}

func (i *CompareResultList) getMaxWeight() int {
	var maxWeight int = 0
	for _, result := range i.CompareResults {
		if result.Weight > maxWeight {
			maxWeight = result.Weight
		}
	}

	return maxWeight
}

func (i *CompareResultList) elevateWeight(lowerMaxWeight int) {
	for idx, _ := range i.CompareResults {
		i.CompareResults[idx].Weight += lowerMaxWeight
	}
}

func (i *CompareResultList) trimUniqueMatches(uniqueMatchItems []CompareResult) {

	newLen := len(i.CompareResults) - len(uniqueMatchItems)
	trimmedList := make([]CompareResult, newLen)

	i.sort()
	sort.Sort(ByLeftRight(uniqueMatchItems))

	curI := 0
	sglI := 0
	trmI := 0
	var diff int

	for curI < len(i.CompareResults) {

		if sglI >= len(uniqueMatchItems) {
			diff = -1
		} else {
			diff = compareCompareResults(i.CompareResults[curI], uniqueMatchItems[sglI])
		}

		if diff < 0 {
			trimmedList[trmI] = i.CompareResults[curI]
			trmI++
			curI++

		} else if diff == 0 {
			curI++

		} else {
			sglI++

		}
	}

	if trmI != newLen {
		log.Error("Did not trim properly?? newLen: %d trmI: %d", newLen, trmI)
		log.Error("Did not trim properly?? len(i.CompareResults): %d len(uniqueMatchItems): %d", len(i.CompareResults), len(uniqueMatchItems))
	}

	i.CompareResults = trimmedList

}

func (i *CompareResultList) MergeRemainingWeightType(remainingResults *CompareResultList) {
	i.sumMatchWeightValues(false, 0, false)
	lowerMaxWeight := i.getMaxWeight()
	remainingResults.elevateWeight(lowerMaxWeight)

	i.CompareResults = append(i.CompareResults, remainingResults.CompareResults...)
	i.sort()
}

func (i *CompareResultList) ProcessMatches(splitMatch bool, maxMatchValue int) []CompareResult {

	if len(i.CompareResults) == 0 {
		return []CompareResult{}
	}

	i.sumMatchWeightValues(splitMatch, maxMatchValue, true)
	uniqueTopMatches := extractUniqueTopMatch(i)

	i.trimUniqueMatches(uniqueTopMatches)

	return uniqueTopMatches

}
