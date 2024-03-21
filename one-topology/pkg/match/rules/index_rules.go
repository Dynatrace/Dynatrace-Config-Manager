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

type IndexRuleTypeList struct {
	RuleTypes []IndexRuleType
}

type IndexRuleType struct {
	Key         int
	IsSeed      bool
	SplitMatch  bool
	WeightValue int
	Rules       []IndexRule
}

type IndexRule struct {
	Name string
	Path []string
	//GetFunc           func(entitiesValues.RawMatchList, int) string
	ListItemKey       ListItemKey
	WeightValue       int
	SelfMatchDisabled bool
	SpecificType      []string
}

type ListItemKey struct {
	KeyKey   string
	KeyValue string
	ValueKey string
}

func (me *IndexRuleTypeList) GetPaths() [][]string {
	paths := [][]string{}

	for _, indexRuleType := range me.RuleTypes {
		for _, indexRule := range indexRuleType.Rules {
			if len(indexRule.Path) > 0 {
				paths = append(paths, indexRule.Path)
			}
		}
	}

	return paths
}

func (me *IndexRuleType) IsSplitMatch() bool {
	return me.SplitMatch
}

func (me *IndexRule) GetWeightValue() int {
	return me.WeightValue
}
