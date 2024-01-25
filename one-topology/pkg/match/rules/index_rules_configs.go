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

const ConfigIdKey = "dtConfigId"
const ConfigNameKey = "dtConfigName"
const EntitiesListKey = "dtEntitiesList"
const Settings20V1Id = "dtSettings20V1Id"
const DownloadedKey = "downloaded"
const ValueKey = "value"

var INDEX_CONFIG_LIST_CONFIGS = IndexRuleTypeList{
	RuleTypes: []IndexRuleType{
		{
			IsSeed:      true,
			SplitMatch:  true,
			WeightValue: 100,
			Rules: []IndexRule{
				{
					Name:              "Config Name",
					Path:              []string{ConfigNameKey},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name:              "Scope",
					Path:              []string{DownloadedKey, "scope"},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name:              "Dashboard Owner",
					Path:              []string{DownloadedKey, ValueKey, "dashboardMetadata", "owner"},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      false,
			SplitMatch:  false,
			WeightValue: 90,
			Rules: []IndexRule{
				{
					Name:              "Entities List",
					Path:              []string{EntitiesListKey},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      false,
			SplitMatch:  false,
			WeightValue: 50,
			Rules: []IndexRule{
				{
					Name:              "id",
					Path:              []string{ConfigIdKey},
					WeightValue:       2,
					SelfMatchDisabled: true,
				},
			},
		},
	},
}
