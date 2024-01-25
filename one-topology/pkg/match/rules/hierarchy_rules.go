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

type HierarchySourceList struct {
	Sources []HierarchySource
}

type HierarchySource struct {
	Name     string
	Priority int
	Path     []string
}

type ByPriorityHierarchySource []HierarchySource

func (a ByPriorityHierarchySource) Len() int           { return len(a) }
func (a ByPriorityHierarchySource) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByPriorityHierarchySource) Less(i, j int) bool { return a[j].Priority < a[i].Priority }

func (me *HierarchySourceList) GetPaths() [][]string {
	paths := [][]string{}

	for _, source := range me.Sources {
		if len(source.Path) > 0 {
			paths = append(paths, source.Path)
		}
	}

	return paths
}

type HierarchyRuleTypeList struct {
	RuleTypes []HierarchyRuleType
}

type HierarchyRuleType struct {
	Name           string
	Key            int
	IsSeed         bool
	IsParent       bool
	SplitMatch     bool
	WeightValue    int
	HierarchyRules []HierarchyRule
}

type HierarchyRule struct {
	Name              string
	Path              []string
	ResultType        string
	WeightValue       int
	SelfMatchDisabled bool
	SpecificType      []string
}

func (me *HierarchyRuleType) IsSplitMatch() bool {
	return me.SplitMatch
}

func (me *HierarchyRule) GetWeightValue() int {
	return me.WeightValue
}
