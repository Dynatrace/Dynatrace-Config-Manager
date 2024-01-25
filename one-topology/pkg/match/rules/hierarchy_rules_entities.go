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

package rules

import "sort"

var MATCHES_TYPE = "Matches"
var MULTI_MATCHED_TYPE = "MultiMatched"
var POST_PROCESS_TYPE = "PostProcess"

func GetSortedHierarchySourceListEntities() []HierarchySource {
	sources := HIERARCHY_SOURCE_LIST_ENTITIES.Sources
	sort.Sort(ByPriorityHierarchySource(sources))

	return sources
}

var HIERARCHY_SOURCE_LIST_ENTITIES = HierarchySourceList{
	Sources: []HierarchySource{
		{
			Name:     "Runs on Host",
			Priority: 100,
			Path:     []string{"fromRelationships", "runsOnHost"},
		},
		{
			Name:     "Is Process Of",
			Priority: 90,
			Path:     []string{"fromRelationships", "isProcessOf"},
		},
		{
			Name:     "Runs on",
			Priority: 80,
			Path:     []string{"fromRelationships", "runsOn"},
		},
		{
			Name:     "Is instance of",
			Priority: 70,
			Path:     []string{"fromRelationships", "isInstanceOf"},
		},
		{
			Name:     "Is container group instance of host",
			Priority: 60,
			Path:     []string{"fromRelationships", "isCgiOfHost"},
		},
		{
			Name:     "Is disk of",
			Priority: 60,
			Path:     []string{"fromRelationships", "isDiskOf"},
		},
		{
			Name:     "Step of",
			Priority: 60,
			Path:     []string{"fromRelationships", "isStepOf"},
		},
		{
			Name:     "Application of synthetic test",
			Priority: 60,
			Path:     []string{"fromRelationships", "isApplicationOfSyntheticTest"},
		},
		{
			Name:     "Is Group Of",
			Priority: 50,
			Path:     []string{"fromRelationships", "isGroupOf"},
		},
		{
			Name:     "Is Application Method Group Of",
			Priority: 40,
			Path:     []string{"fromRelationships", "isApplicationMethodOfGroup"},
		},
		{
			Name:     "Is Child Of",
			Priority: 30,
			Path:     []string{"fromRelationships", "isChildOf"},
		},
	},
}

var HIERARCHY_CONFIG_LIST_ENTITIES = HierarchyRuleTypeList{
	RuleTypes: []HierarchyRuleType{
		{
			IsSeed:      true,
			IsParent:    true,
			WeightValue: 100,
			HierarchyRules: []HierarchyRule{
				{
					Name:              "Matches",
					ResultType:        MATCHES_TYPE,
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      true,
			IsParent:    true,
			WeightValue: 90,
			HierarchyRules: []HierarchyRule{
				{
					Name:              "Multi Matched",
					ResultType:        MULTI_MATCHED_TYPE,
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      true,
			IsParent:    false,
			WeightValue: 80,
			HierarchyRules: []HierarchyRule{
				{
					Name:              "Matches",
					ResultType:        MATCHES_TYPE,
					WeightValue:       2,
					SelfMatchDisabled: false,
				},
				{
					Name:              "Multi Matched",
					ResultType:        MULTI_MATCHED_TYPE,
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      true,
			IsParent:    false,
			WeightValue: 70,
			HierarchyRules: []HierarchyRule{
				{
					Name:              "PostProcess",
					ResultType:        POST_PROCESS_TYPE,
					WeightValue:       0,
					SelfMatchDisabled: false,
				},
			},
		},
	},
}
