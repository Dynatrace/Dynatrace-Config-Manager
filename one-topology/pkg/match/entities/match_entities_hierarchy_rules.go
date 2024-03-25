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
	"sort"
	"strings"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
)

// ByWeightTypeValue implements sort.Interface for []IndexRule based on
// the WeightTypeValue field.
type byWeightTypeValueHierarchy []rules.HierarchyRuleType

func (a byWeightTypeValueHierarchy) Len() int           { return len(a) }
func (a byWeightTypeValueHierarchy) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byWeightTypeValueHierarchy) Less(i, j int) bool { return a[j].WeightValue < a[i].WeightValue }

type HierarchyRuleMapGenerator struct {
	SelfMatch    bool
	baseRuleList rules.HierarchyRuleTypeList
}

func NewHierarchyRuleMapGenerator(selfMatch bool, ruleList rules.HierarchyRuleTypeList) *HierarchyRuleMapGenerator {
	i := new(HierarchyRuleMapGenerator)
	i.SelfMatch = selfMatch
	i.baseRuleList = ruleList
	return i
}

func (i *HierarchyRuleMapGenerator) genActiveList() []rules.HierarchyRuleType {

	activeList := make([]rules.HierarchyRuleType, 0, len(i.baseRuleList.RuleTypes))

	for idx, confType := range i.baseRuleList.RuleTypes {
		ruleType := rules.HierarchyRuleType{
			Name:           confType.Name,
			Key:            idx,
			IsSeed:         confType.IsSeed,
			IsParent:       confType.IsParent,
			SplitMatch:     confType.SplitMatch,
			WeightValue:    confType.WeightValue,
			HierarchyRules: make([]rules.HierarchyRule, 0, len(confType.HierarchyRules)),
		}
		for _, conf := range confType.HierarchyRules {
			if conf.SelfMatchDisabled && i.SelfMatch {
				continue
			}
			ruleType.HierarchyRules = append(ruleType.HierarchyRules, conf)
		}
		if len(ruleType.HierarchyRules) >= 1 {
			activeList = append(activeList, ruleType)
		}
	}

	return activeList
}

func (i *HierarchyRuleMapGenerator) genSortedActiveList() []rules.HierarchyRuleType {

	activeList := i.genActiveList()

	sort.Sort(byWeightTypeValueHierarchy(activeList))

	return activeList
}

type UnindexedMatches struct {
	sourceId  string
	sourceIdx int
	targetId  string
	targetIdx int
}

type bySourceIdUnindexed []UnindexedMatches

func (a bySourceIdUnindexed) Len() int           { return len(a) }
func (a bySourceIdUnindexed) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a bySourceIdUnindexed) Less(i, j int) bool { return a[i].sourceId < a[j].sourceId }

type byTargetIdUnindexed []UnindexedMatches

func (a byTargetIdUnindexed) Len() int           { return len(a) }
func (a byTargetIdUnindexed) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byTargetIdUnindexed) Less(i, j int) bool { return a[i].targetId < a[j].targetId }

type bySourceIdxUnindexed []UnindexedMatches

func (a bySourceIdxUnindexed) Len() int           { return len(a) }
func (a bySourceIdxUnindexed) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a bySourceIdxUnindexed) Less(i, j int) bool { return a[i].sourceIdx < a[j].sourceIdx }

type byTargetIdxUnindexed []UnindexedMatches

func (a byTargetIdxUnindexed) Len() int           { return len(a) }
func (a byTargetIdxUnindexed) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byTargetIdxUnindexed) Less(i, j int) bool { return a[i].targetIdx < a[j].targetIdx }

func runHierarchyRule(hierarchyRule rules.HierarchyRule, hierarchyRuleType rules.HierarchyRuleType, entityProcessingPtrChild *processing.MatchProcessing, entityProcessingPtrParent *processing.MatchProcessing, entityMatchesChild MatchOutputType, entityMatchesParent MatchOutputType, resultListPtr *processing.CompareResultList, childIdxToParentIdxSource *ChildIdxToParentIdx, childIdxToParentIdxTarget *ChildIdxToParentIdx, matchedEntitiesParent map[int]int) {
	var entityProcessingPtrUsed *processing.MatchProcessing = nil
	var entityMatchesUsed *MatchOutputType = nil
	if hierarchyRuleType.IsParent {
		entityProcessingPtrUsed = entityProcessingPtrParent
		entityMatchesUsed = &entityMatchesParent
	} else {
		entityProcessingPtrUsed = entityProcessingPtrChild
		entityMatchesUsed = &entityMatchesChild
	}

	var matchesCurrent []UnindexedMatches = []UnindexedMatches{}
	if hierarchyRule.ResultType == rules.MATCHES_TYPE {
		for sourceId, targetId := range entityMatchesUsed.Matches {
			matchesCurrent = append(matchesCurrent, UnindexedMatches{sourceId, -1, targetId, -1})
		}
	} else if hierarchyRule.ResultType == rules.MULTI_MATCHED_TYPE {
		matchesCurrent = multiMatchToUnindexedMatches(entityMatchesUsed)
	}

	matchesCurrent = assignSourceIds(matchesCurrent, entityProcessingPtrUsed)
	matchesCurrent = assignTargetIds(matchesCurrent, entityProcessingPtrUsed)

	if hierarchyRuleType.IsParent {
		// pass
	} else {
		matches := make([]UnindexedMatches, 0, len(matchesCurrent))

		for _, match := range matchesCurrent {
			if match.sourceIdx <= -1 || match.targetIdx <= -1 {
				continue
			}

			sourceIdx := (*childIdxToParentIdxSource)[match.sourceIdx]
			targetIdx := (*childIdxToParentIdxTarget)[match.targetIdx]

			matches = append(matches, UnindexedMatches{sourceIdx: sourceIdx, targetIdx: targetIdx})
		}

		matchesCurrent = matches
	}

	matches := keepRemainingOnlySource(matchesCurrent, entityProcessingPtrParent)
	matchesCurrent = keepRemainingOnlyTarget(matches, entityProcessingPtrParent)

	for _, match := range matchesCurrent {

		if match.sourceIdx <= -1 || match.targetIdx <= -1 {
			continue
		}

		(*resultListPtr).AddResult(match.sourceIdx, match.targetIdx, hierarchyRule.WeightValue)
	}
}

func multiMatchToUnindexedMatches(entityMatchesUsed *MatchOutputType) []UnindexedMatches {
	matchesCurrent := []UnindexedMatches{}

	for sourceId, targetIdList := range entityMatchesUsed.MultiMatched {
		for _, targetId := range targetIdList {
			matchesCurrent = append(matchesCurrent, UnindexedMatches{sourceId, -1, targetId, -1})
		}
	}
	return matchesCurrent
}

func keepRemainingOnlySource(matches []UnindexedMatches, entityProcessingPtrParent *processing.MatchProcessing) []UnindexedMatches {
	sort.Sort(bySourceIdxUnindexed(matches))
	remainingSource := entityProcessingPtrParent.Source.CurrentRemainingMatch

	idxMatches := 0
	idxRemaining := 0

	matchesCurrent := make([]UnindexedMatches, 0, len(matches))

	for idxMatches < len(matches) && idxRemaining < len(*remainingSource) {

		if matches[idxMatches].sourceIdx <= -1 {
			idxMatches++
			continue
		}

		if matches[idxMatches].sourceIdx > (*remainingSource)[idxRemaining] {
			idxRemaining++
			continue
		}
		if matches[idxMatches].sourceIdx < (*remainingSource)[idxRemaining] {
			idxMatches++
			continue
		}

		matchesCurrent = append(matchesCurrent, matches[idxMatches])
		idxMatches++

	}
	return matchesCurrent
}

func keepRemainingOnlyTarget(matches []UnindexedMatches, entityProcessingPtrParent *processing.MatchProcessing) []UnindexedMatches {
	sort.Sort(byTargetIdxUnindexed(matches))
	remainingTarget := entityProcessingPtrParent.Target.CurrentRemainingMatch

	idxMatches := 0
	idxRemaining := 0

	matchesCurrent := make([]UnindexedMatches, 0, len(matches))

	for idxMatches < len(matches) && idxRemaining < len(*remainingTarget) {
		if matches[idxMatches].targetIdx <= -1 {
			idxMatches++
			continue
		}

		if matches[idxMatches].targetIdx > (*remainingTarget)[idxRemaining] {
			idxRemaining++
			continue
		}
		if matches[idxMatches].targetIdx < (*remainingTarget)[idxRemaining] {
			idxMatches++
			continue
		}

		matchesCurrent = append(matchesCurrent, matches[idxMatches])
		idxMatches++

	}
	return matchesCurrent
}

func assignTargetIds(matchesCurrent []UnindexedMatches, entityProcessingPtrUsed *processing.MatchProcessing) []UnindexedMatches {
	sort.Sort(byTargetIdUnindexed(matchesCurrent))
	rawEntityValuesTarget := *entityProcessingPtrUsed.Target.RawMatchList.GetValues()

	idxMatches := 0
	idxTarget := 0

	for idxMatches < len(matchesCurrent) && idxTarget < len(rawEntityValuesTarget) {
		entityIdMatch := matchesCurrent[idxMatches].targetId
		entityIdTarget := rawEntityValuesTarget[idxTarget].EntityId

		diff := strings.Compare(entityIdMatch, entityIdTarget)

		if diff < 0 {
			idxMatches++
			continue
		}
		if diff > 0 {
			idxTarget++
			continue
		}

		matchesCurrent[idxMatches].targetIdx = idxTarget

		idxMatches++
	}

	return matchesCurrent
}

func assignSourceIds(matchesCurrent []UnindexedMatches, entityProcessingPtrUsed *processing.MatchProcessing) []UnindexedMatches {
	sort.Sort(bySourceIdUnindexed(matchesCurrent))
	rawEntityValuesSource := *entityProcessingPtrUsed.Source.RawMatchList.GetValues()

	idxMatches := 0
	idxSource := 0

	for idxMatches < len(matchesCurrent) && idxSource < len(rawEntityValuesSource) {
		entityIdMatch := matchesCurrent[idxMatches].sourceId
		entityIdSource := rawEntityValuesSource[idxSource].EntityId

		diff := strings.Compare(entityIdMatch, entityIdSource)

		if diff < 0 {
			idxMatches++
			continue
		}
		if diff > 0 {
			idxSource++
			continue
		}

		matchesCurrent[idxMatches].sourceIdx = idxSource

		idxMatches++
	}
	return matchesCurrent
}

func keepHierarchyMatches(matchedEntities map[int]int, uniqueMatch []processing.CompareResult) map[int]int {
	for _, result := range uniqueMatch {
		_, found := matchedEntities[result.LeftId]

		if found {
			log.Error("Should never find multiple exact matches for an entity, %v", result)
		}

		matchedEntities[result.LeftId] = result.RightId
	}

	return matchedEntities
}

func (i *HierarchyRuleMapGenerator) RunHierarchyRuleAll(entityProcessingPtrChild *processing.MatchProcessing, entityProcessingPtrParent *processing.MatchProcessing,
	entityMatchesChild MatchOutputType, entityMatchesParent MatchOutputType,
	childIdxToParentIdxSource *ChildIdxToParentIdx, childIdxToParentIdxTarget *ChildIdxToParentIdx,
	sourceHierarchy rules.HierarchySource) (*processing.CompareResultList, *map[int]int, *map[int]int) {

	matchedEntities := map[int]int{}
	remainingResultsPtr := &processing.CompareResultList{}

	ruleTypes := i.genSortedActiveList()

	multiMatchedBeforeChild, multiMatchedBeforeParent := printHierarchyStatsBefore(entityMatchesChild, sourceHierarchy, entityProcessingPtrChild, entityMatchesParent, entityProcessingPtrParent)

	for _, hierarchyRuleType := range ruleTypes {
		resultListPtr := processing.NewCompareResultList(&hierarchyRuleType)
		entityProcessingPtrParent.PrepareRemainingMatch(true, hierarchyRuleType.IsSeed, remainingResultsPtr)

		maxMatchValue := 0
		for _, hierarchyRule := range hierarchyRuleType.HierarchyRules {
			runHierarchyRule(hierarchyRule, hierarchyRuleType, entityProcessingPtrChild, entityProcessingPtrParent, entityMatchesChild, entityMatchesParent, resultListPtr, childIdxToParentIdxSource, childIdxToParentIdxTarget, matchedEntities)
		}

		resultListPtr.MergeRemainingWeightType(remainingResultsPtr)

		uniqueMatchEntities := resultListPtr.ProcessMatches(hierarchyRuleType.SplitMatch, maxMatchValue)
		remainingResultsPtr = resultListPtr

		entityProcessingPtrParent.AdjustremainingMatch(&uniqueMatchEntities)

		matchedEntities = keepHierarchyMatches(matchedEntities, uniqueMatchEntities)
	}

	matchEntitiesChild := resolveChildMultiMatchesFromParents(entityMatchesChild, entityProcessingPtrChild,
		childIdxToParentIdxSource, childIdxToParentIdxTarget, matchedEntities)

	matchEntitiesChild = resolveChildPostProcessFromParents(entityMatchesChild, entityProcessingPtrChild,
		childIdxToParentIdxSource, childIdxToParentIdxTarget, matchedEntities, matchEntitiesChild)

	printHierarchyStatsAfter(sourceHierarchy, entityProcessingPtrChild, matchEntitiesChild, multiMatchedBeforeChild, matchedEntities, entityProcessingPtrParent, entityMatchesParent, multiMatchedBeforeParent)

	return remainingResultsPtr, &matchedEntities, &matchEntitiesChild
}

func printHierarchyStatsAfter(sourceHierarchy rules.HierarchySource, entityProcessingPtrChild *processing.MatchProcessing, matchEntitiesChild map[int]int, multiMatchedBeforeChild int, matchedEntities map[int]int, entityProcessingPtrParent *processing.MatchProcessing, entityMatchesParent MatchOutputType, multiMatchedBeforeParent int) {
	log.Info("Child: Hierarchy : %s, Type: %s -> Source count %d and Target count %d -> Matched: %d / %d", sourceHierarchy.Name, entityProcessingPtrChild.GetType(),
		entityProcessingPtrChild.Source.RawMatchList.Len(), entityProcessingPtrChild.Target.RawMatchList.Len(), len(matchEntitiesChild), multiMatchedBeforeChild)

	matchedFromMultiMatchedParent := calculateMatchedFromMultiMatched(matchedEntities, entityProcessingPtrParent, entityMatchesParent)

	log.Info("Parent: Hierarchy: %s, Type: %s -> Source count %d and Target count %d -> Matched: %d / %d", sourceHierarchy.Name, entityProcessingPtrParent.GetType(),
		entityProcessingPtrParent.Source.RawMatchList.Len(), entityProcessingPtrParent.Target.RawMatchList.Len(), matchedFromMultiMatchedParent, multiMatchedBeforeParent)
}

func printHierarchyStatsBefore(entityMatchesChild MatchOutputType, sourceHierarchy rules.HierarchySource, entityProcessingPtrChild *processing.MatchProcessing, entityMatchesParent MatchOutputType, entityProcessingPtrParent *processing.MatchProcessing) (int, int) {
	multiMatchedBeforeChild := entityMatchesChild.calcMultiMatched()
	log.Info("Child: Hierarchy : %s, Type: %s -> Source count %d and Target count %d, Multi Matched: %d", sourceHierarchy.Name, entityProcessingPtrChild.GetType(),
		entityProcessingPtrChild.Source.RawMatchList.Len(), entityProcessingPtrChild.Target.RawMatchList.Len(), multiMatchedBeforeChild)

	multiMatchedBeforeParent := entityMatchesParent.calcMultiMatched()
	log.Info("Parent: Hierarchy: %s, Type: %s -> Source count %d and Target count %d, Multi Matched: %d", sourceHierarchy.Name, entityProcessingPtrParent.GetType(),
		entityProcessingPtrParent.Source.RawMatchList.Len(), entityProcessingPtrParent.Target.RawMatchList.Len(), multiMatchedBeforeParent)
	return multiMatchedBeforeChild, multiMatchedBeforeParent
}

func calculateMatchedFromMultiMatched(matchedEntities map[int]int, entityProcessingPtrParent *processing.MatchProcessing, entityMatchesParent MatchOutputType) int {
	matchedFromMultiMatchedParent := 0
	for sourceIdxParent := range matchedEntities {
		entityIdSourceParent := (*entityProcessingPtrParent.Source.RawMatchList.GetValues())[sourceIdxParent].EntityId

		_, found := entityMatchesParent.Matches[entityIdSourceParent]

		if found {
			// pass
		} else {
			matchedFromMultiMatchedParent++
		}
	}
	return matchedFromMultiMatchedParent
}

func resolveChildPostProcessFromParents(entityMatchesChild MatchOutputType, entityProcessingPtrChild *processing.MatchProcessing,
	childIdxToParentIdxSource *ChildIdxToParentIdx, childIdxToParentIdxTarget *ChildIdxToParentIdx,
	matchedEntitiesParent map[int]int, matchedEntitiesChild map[int]int) map[int]int {

	rawEntityValuesChildSource := *entityProcessingPtrChild.Source.RawMatchList.GetValues()
	rawEntityValuesChildTarget := *entityProcessingPtrChild.Target.RawMatchList.GetValues()

	for postProcessId, postProcessSource := range entityMatchesChild.PostProcessSource {
		postProcessTarget, foundTarget := entityMatchesChild.PostProcessTarget[postProcessId]

		if foundTarget {
			// pass
		} else {
			continue
		}

		unindexedIdxSource, entityIdKeepSource := postProcessToUnindexedSource(postProcessSource, entityProcessingPtrChild)
		unindexedIdxTarget, entityIdKeepTarget := postProcessToUnindexedTarget(postProcessTarget, entityProcessingPtrChild)

		idxByParentIdxSource := getSourceByParent(unindexedIdxSource, childIdxToParentIdxSource)
		idxByParentIdxTarget := getTargetByParent(unindexedIdxTarget, childIdxToParentIdxTarget)

		for idxSourceParent, idxSourceChildList := range idxByParentIdxSource {
			idxTargetParent, foundParentTarget := matchedEntitiesParent[idxSourceParent]

			if foundParentTarget {
				// pass
			} else {
				continue
			}

			idxTargetChildList, targetChildListFound := idxByParentIdxTarget[idxTargetParent]

			if targetChildListFound {
				// pass
			} else {
				continue
			}

			if len(idxSourceChildList) == 1 && len(idxTargetChildList) == 1 {
				sourceIdx := idxSourceChildList[0]
				targetIdx := idxTargetChildList[0]

				prevTargetIdx, foundMatch := matchedEntitiesChild[sourceIdx]

				if foundMatch {
					if prevTargetIdx == targetIdx {
						log.Info("Post-Process: Other match already found for: %d, %d", sourceIdx, targetIdx, prevTargetIdx)
					}
					continue
				}

				matchedEntitiesChild[sourceIdx] = targetIdx

				entityIdSource := rawEntityValuesChildSource[sourceIdx].EntityId
				entityIdKeepSource[entityIdSource] = false

				entityIdTarget := rawEntityValuesChildTarget[targetIdx].EntityId
				entityIdKeepTarget[entityIdTarget] = false

			}

		}

		reducedListSource := genReducedList(entityIdKeepSource)
		entityMatchesChild.PostProcessSource[postProcessId].IDs = reducedListSource

		reducedListTarget := genReducedList(entityIdKeepTarget)
		entityMatchesChild.PostProcessTarget[postProcessId].IDs = reducedListTarget

	}

	return matchedEntitiesChild

}

func genReducedList(entityIdKeep map[string]bool) []string {
	reducedList := []string{}
	for entityId, keep := range entityIdKeep {
		if keep {
			reducedList = append(reducedList, entityId)
		}
	}
	return reducedList
}

func resolveChildMultiMatchesFromParents(entityMatchesChild MatchOutputType, entityProcessingPtrChild *processing.MatchProcessing,
	childIdxToParentIdxSource *ChildIdxToParentIdx, childIdxToParentIdxTarget *ChildIdxToParentIdx,
	matchedEntities map[int]int) map[int]int {

	entityMatchesChildIdx := multiMatchToUnindexedMatches(&entityMatchesChild)
	entityMatchesChildIdx = assignSourceIds(entityMatchesChildIdx, entityProcessingPtrChild)
	entityMatchesChildIdx = assignTargetIds(entityMatchesChildIdx, entityProcessingPtrChild)

	multiMatchIdxChild := map[int][]int{}

	for _, match := range entityMatchesChildIdx {
		_, found := multiMatchIdxChild[match.sourceIdx]
		if found {
			// pass
		} else {
			multiMatchIdxChild[match.sourceIdx] = []int{}
		}

		multiMatchIdxChild[match.sourceIdx] = append(multiMatchIdxChild[match.sourceIdx], match.targetIdx)
	}

	matchIdxChild := map[int]int{}

	for sourceIdxChild, targetIdxChildList := range multiMatchIdxChild {

		sourceIdxParent := (*childIdxToParentIdxSource)[sourceIdxChild]
		targetIdxParent, foundParentMatch := matchedEntities[sourceIdxParent]

		if foundParentMatch {
			// pass
		} else {
			continue
		}

		childOfTargetParentIdx := -1

		for _, targetIdxChild := range targetIdxChildList {
			targetIdxParentOfPotentialChild := (*childIdxToParentIdxTarget)[targetIdxChild]
			if targetIdxParent == targetIdxParentOfPotentialChild {
				if childOfTargetParentIdx == -1 {
					childOfTargetParentIdx = targetIdxChild
				} else if childOfTargetParentIdx >= 0 {
					childOfTargetParentIdx = -1
					break
				}
			}
		}

		if childOfTargetParentIdx >= 0 {
			matchIdxChild[sourceIdxChild] = childOfTargetParentIdx
		}

	}
	return matchIdxChild
}

func getSourceByParent(unindexedSourceIdx []UnindexedMatches, childIdxToParentIdxSource *ChildIdxToParentIdx) map[int][]int {
	getParentIdxForUnindexedSource := func(unindexed UnindexedMatches) (int, int) {
		return unindexed.sourceIdx, (*childIdxToParentIdxSource)[unindexed.sourceIdx]
	}

	return getChildsByParent(unindexedSourceIdx, getParentIdxForUnindexedSource)
}

func getTargetByParent(unindexedTargetIdx []UnindexedMatches, childIdxToParentIdxTarget *ChildIdxToParentIdx) map[int][]int {
	getParentIdxForUnindexedTarget := func(unindexed UnindexedMatches) (int, int) {
		return unindexed.targetIdx, (*childIdxToParentIdxTarget)[unindexed.targetIdx]
	}

	return getChildsByParent(unindexedTargetIdx, getParentIdxForUnindexedTarget)
}

func getChildsByParent(unindexedIdx []UnindexedMatches, getParentIdxForUnindexed func(UnindexedMatches) (int, int)) map[int][]int {
	idxByParentIdx := map[int][]int{}
	for _, unindexed := range unindexedIdx {
		unindexedIdx, idxParent := getParentIdxForUnindexed(unindexed)

		_, found := idxByParentIdx[idxParent]

		if found {
			// pass
		} else {
			idxByParentIdx[idxParent] = []int{}
		}

		idxByParentIdx[idxParent] = append(idxByParentIdx[idxParent], unindexedIdx)
	}
	return idxByParentIdx
}

func postProcessToUnindexedSource(postProcess *PostProcessOutput, entityProcessingPtrChild *processing.MatchProcessing) ([]UnindexedMatches, map[string]bool) {
	unindexedIdx := []UnindexedMatches{}
	entityIdKeep := map[string]bool{}

	for _, entityId := range postProcess.IDs {
		unindexedIdx = append(unindexedIdx, UnindexedMatches{
			sourceId: entityId,
		})
		entityIdKeep[entityId] = true
	}

	unindexedIdx = assignSourceIds(unindexedIdx, entityProcessingPtrChild)

	return unindexedIdx, entityIdKeep
}
func postProcessToUnindexedTarget(postProcess *PostProcessOutput, entityProcessingPtrChild *processing.MatchProcessing) ([]UnindexedMatches, map[string]bool) {
	unindexedIdx := []UnindexedMatches{}
	entityIdKeep := map[string]bool{}

	for _, entityId := range postProcess.IDs {
		unindexedIdx = append(unindexedIdx, UnindexedMatches{
			targetId: entityId,
		})
		entityIdKeep[entityId] = true
	}

	unindexedIdx = assignTargetIds(unindexedIdx, entityProcessingPtrChild)

	return unindexedIdx, entityIdKeep
}
