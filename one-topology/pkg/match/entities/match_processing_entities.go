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
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
)

func runRules(entityProcessingPtr *match.MatchProcessing, matchParameters match.MatchParameters, prevMatches MatchOutputType) MatchOutputType {

	ruleMapGenerator := match.NewIndexRuleMapGenerator(matchParameters.SelfMatch, rules.INDEX_CONFIG_LIST_ENTITIES)

	remainingResultsPtr, matchedEntities := ruleMapGenerator.RunIndexRuleAll(entityProcessingPtr)

	outputPayload := genOutputPayload(entityProcessingPtr, remainingResultsPtr, matchedEntities, prevMatches)
	log.Info("Type: %s -> source count %d and target count %d -> Matched after Prev and FirstSeen: %d",
		entityProcessingPtr.GetType(), len(*entityProcessingPtr.Source.RawMatchList.GetValues()),
		len(*entityProcessingPtr.Target.RawMatchList.GetValues()), len(outputPayload.Matches))

	return outputPayload

}
