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
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
)

func runRulesHierarchy(entityProcessingPtrChild *processing.MatchProcessing, entityProcessingPtrParent *processing.MatchProcessing, matchParameters match.MatchParameters,
	entityMatchesChild MatchOutputType, entityMatchesParent MatchOutputType,
	childIdxToParentIdxSource *ChildIdxToParentIdx, childIdxToParentIdxTarget *ChildIdxToParentIdx,
	sourceHierarchy rules.HierarchySource) (MatchOutputType, MatchOutputType) {

	ruleMapGenerator := NewHierarchyRuleMapGenerator(matchParameters.SelfMatch, rules.HIERARCHY_CONFIG_LIST_ENTITIES)

	_, matchedEntitiesParent, matchedEntitiesChild := ruleMapGenerator.RunHierarchyRuleAll(entityProcessingPtrChild, entityProcessingPtrParent, entityMatchesChild, entityMatchesParent, childIdxToParentIdxSource, childIdxToParentIdxTarget, sourceHierarchy)

	updateMatches(matchedEntitiesParent, entityProcessingPtrParent, &entityMatchesParent)
	updateMatches(matchedEntitiesChild, entityProcessingPtrChild, &entityMatchesChild)

	return entityMatchesParent, entityMatchesChild

}

func updateMatches(matchedEntities *map[int]int, entityProcessingPtr *processing.MatchProcessing, entityMatches *MatchOutputType) {
	for sourceIdx, targetIdx := range *matchedEntities {

		entityIdSource := (*entityProcessingPtr.Source.RawMatchList.GetValues())[sourceIdx].EntityId
		entityIdTarget := (*entityProcessingPtr.Target.RawMatchList.GetValues())[targetIdx].EntityId

		entityMatches.Matches[entityIdSource] = entityIdTarget

		_, found := entityMatches.MultiMatched[entityIdSource]
		if found {
			delete(entityMatches.MultiMatched, entityIdSource)
		}

	}
}
