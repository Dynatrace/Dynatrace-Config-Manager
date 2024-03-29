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
	"strings"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
)

func compareIndexes(resultListPtr *processing.CompareResultList, indexSource []IndexEntry, indexTarget []IndexEntry, indexRule rules.IndexRule, indexRuleType rules.IndexRuleType) bool {

	needsPostProcessing := false
	srcI := 0
	tgtI := 0

	for srcI < len(indexSource) && tgtI < len(indexTarget) {
		diff := strings.Compare(indexSource[srcI].indexValue, indexTarget[tgtI].indexValue)

		if diff < 0 {
			srcI++
			continue
		}

		if diff > 0 {
			tgtI++
			continue
		}

		totalMatches := len(indexSource[srcI].matchedIds) * len(indexTarget[tgtI].matchedIds)
		if totalMatches > 1000 {
			needsPostProcessing = true
			(*resultListPtr).AddPostProcess(&indexRuleType, &indexRule, indexSource[srcI].matchedIds, indexTarget[tgtI].matchedIds, indexSource[srcI].indexValue)
			srcI++
			continue
		}

		for _, itemIdSource := range indexSource[srcI].matchedIds {
			for _, itemIdTarget := range indexTarget[tgtI].matchedIds {
				(*resultListPtr).AddResult(itemIdSource, itemIdTarget, indexRule.WeightValue)
			}
		}

		srcI++
	}

	return needsPostProcessing

}
