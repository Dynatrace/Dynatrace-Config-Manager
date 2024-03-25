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
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
)

func runRules(configProcessingPtr *processing.MatchProcessing, matchParameters match.MatchParameters, configsTypeInfo configTypeInfo, prevMatches MatchOutputType) (MatchOutputType, Module, []bool, error) {

	ruleMapGenerator := match.NewIndexRuleMapGenerator(matchParameters.SelfMatch, rules.INDEX_CONFIG_LIST_CONFIGS)

	remainingResultsPtr, matchedConfigs := ruleMapGenerator.RunIndexRuleAll(configProcessingPtr)

	outputPayload, matchEntityMatches, configIdxToWriteSource, err := genOutputPayload(matchParameters, configProcessingPtr, remainingResultsPtr, matchedConfigs, configsTypeInfo, prevMatches)

	return outputPayload, matchEntityMatches, configIdxToWriteSource, err

}
