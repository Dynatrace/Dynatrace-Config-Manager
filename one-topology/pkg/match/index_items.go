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
	"sort"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	v2 "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/rules"
)

type IndexMap map[string][]int

type IndexEntry struct {
	indexValue string
	matchedIds []int
}

type ByIndexValue []IndexEntry

func (a ByIndexValue) Len() int           { return len(a) }
func (a ByIndexValue) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByIndexValue) Less(i, j int) bool { return a[i].indexValue < a[j].indexValue }

func addUniqueValueToIndex(index *IndexMap, value string, itemId int) {

	if value == "" {
		return
	}

	(*index)[value] = append((*index)[value], itemId)

}

func addValueToIndex(index *IndexMap, value interface{}, itemId int) {

	stringValue, isString := value.(string)

	if isString {
		addUniqueValueToIndex(
			index, stringValue, itemId)
		return
	}

	stringSliceValue, isStringSlice := value.([]string)
	if isStringSlice {
		for _, uniqueValue := range stringSliceValue {
			addUniqueValueToIndex(
				index, uniqueValue, itemId)
		}
		return
	}

	sliceValue, isInterfaceSlice := value.([]interface{})

	if isInterfaceSlice {
		for _, uniqueValue := range sliceValue {
			addUniqueValueToIndex(
				index, uniqueValue.(string), itemId)
		}
		return
	}
}

func GetValueFromPath(item interface{}, path []string) interface{} {

	if len(path) <= 0 {
		return nil
	}

	var current interface{}
	current = item

	for _, field := range path {

		fieldValue, ok := (current.(map[string]interface{}))[field]
		if ok {
			current = fieldValue
		} else {
			current = nil
			break
		}

	}

	if current == nil {
		return nil
	} else {
		return current
	}
}

func flattenSortIndex(index *IndexMap) []IndexEntry {

	flatIndex := make([]IndexEntry, len(*index))
	idx := 0

	for indexValue, matchedIds := range *index {
		flatIndex[idx] = IndexEntry{
			indexValue: indexValue,
			matchedIds: matchedIds,
		}
		idx++
	}

	sort.Sort(ByIndexValue(flatIndex))

	return flatIndex
}

func genSortedItemsIndex(indexRule rules.IndexRule, items *processing.MatchProcessingEnv) []IndexEntry {

	index := IndexMap{}

	for _, itemIdx := range *(items.CurrentRemainingMatch) {

		if items.ConfigType.ID() == v2.EntityTypeId {
			processEntityRule(indexRule, items, itemIdx, index)

		} else {
			value := GetValueFromPath((*items.RawMatchList.GetValuesConfig())[itemIdx], indexRule.Path)
			if value != nil {
				addValueToIndex(&index, value, itemIdx)
			}
		}

	}

	flatSortedIndex := flattenSortIndex(&index)

	return flatSortedIndex
}

func processEntityRule(indexRule rules.IndexRule, items *processing.MatchProcessingEnv, itemIdx int, index IndexMap) {
	if indexRule.Getter != nil {
		item := indexRule.Getter((*items.RawMatchList.GetValues())[itemIdx])
		if item != nil {
			addUniqueValueToIndex(&index, *item, itemIdx)
		}
	} else if indexRule.GetterList != nil {
		itemList := indexRule.GetterList((*items.RawMatchList.GetValues())[itemIdx])
		if itemList != nil {
			for _, item := range *itemList {
				addUniqueValueToIndex(&index, item, itemIdx)
			}
		}
	} else if indexRule.GetterMetadata != nil {
		metadataList := indexRule.GetterMetadata((*items.RawMatchList.GetValues())[itemIdx])
		if metadataList != nil {
			for _, metadata := range *metadataList {
				if metadata.Key == indexRule.ListItemKey {
					addUniqueValueToIndex(&index, metadata.Value, itemIdx)
				}
			}
		}
	} else {
		log.Error("IndexRule is missing Getter: %s", indexRule.Name)
		panic("indexrules must have defined getters")
	}
}
