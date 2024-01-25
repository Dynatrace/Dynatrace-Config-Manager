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
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/rules"
)

func runRulesHierarchy(entityProcessingPtrChild *match.MatchProcessing, entityProcessingPtrParent *match.MatchProcessing, matchParameters match.MatchParameters,
	entityMatchesChild MatchOutputType, entityMatchesParent MatchOutputType,
	childIdxToParentIdxSource *ChildIdxToParentIdx, childIdxToParentIdxTarget *ChildIdxToParentIdx,
	sourceHierarchy rules.HierarchySource) (MatchOutputType, MatchOutputType) {

	ruleMapGenerator := NewHierarchyRuleMapGenerator(matchParameters.SelfMatch, rules.HIERARCHY_CONFIG_LIST_ENTITIES)

	_, matchedEntitiesParent, matchedEntitiesChild := ruleMapGenerator.RunHierarchyRuleAll(entityProcessingPtrChild, entityProcessingPtrParent, entityMatchesChild, entityMatchesParent, childIdxToParentIdxSource, childIdxToParentIdxTarget, sourceHierarchy)

	updateMatches(matchedEntitiesParent, entityProcessingPtrParent, &entityMatchesParent)
	updateMatches(matchedEntitiesChild, entityProcessingPtrChild, &entityMatchesChild)

	return entityMatchesParent, entityMatchesChild

}

func updateMatches(matchedEntities *map[int]int, entityProcessingPtr *match.MatchProcessing, entityMatches *MatchOutputType) {
	for sourceIdx, targetIdx := range *matchedEntities {

		entityIdSource := (*entityProcessingPtr.Source.RawMatchList.GetValues())[sourceIdx].(map[string]interface{})["entityId"].(string)
		entityIdTarget := (*entityProcessingPtr.Target.RawMatchList.GetValues())[targetIdx].(map[string]interface{})["entityId"].(string)

		entityMatches.Matches[entityIdSource] = entityIdTarget

		_, found := entityMatches.MultiMatched[entityIdSource]
		if found {
			delete(entityMatches.MultiMatched, entityIdSource)
		}

	}
}
