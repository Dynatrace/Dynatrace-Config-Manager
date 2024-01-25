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
	"sort"
	"strings"
	"time"

	"github.com/dynatrace/dynatrace-configuration-as-code/internal/log"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/client"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/rules"
	project "github.com/dynatrace/dynatrace-configuration-as-code/pkg/project/v2"
	"github.com/spf13/afero"
)

type ChildIdxParentId struct {
	childIdx int
	parentId string
}

type byParentId []ChildIdxParentId

func (a byParentId) Len() int           { return len(a) }
func (a byParentId) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byParentId) Less(i, j int) bool { return a[i].parentId < a[j].parentId }

type ChildIdxToParentIdx []int

func MatchEntitiesHierarchy(fs afero.Fs, matchParameters match.MatchParameters, entityPerTypeSource project.ConfigsPerType, entityPerTypeTarget project.ConfigsPerType, stats map[string]string) (map[string]string, error) {

	startTime := time.Now()

	entitiesTypes, err := getEntitiesTypesTarget(matchParameters)
	if err != nil || entitiesTypes == nil {
		return stats, err
	}

	log.Info("Extracted entity types in: %v", time.Since(startTime))
	startTime = time.Now()

	for _, sourceHierarchy := range rules.GetSortedHierarchySourceListEntities() {

		childToParent := getChildToParentMap(sourceHierarchy, entitiesTypes)

		for entityTypeChild, entityTypeParentList := range childToParent {
			for _, entityTypeParent := range entityTypeParentList {

				_, foundSC := entityPerTypeSource[entityTypeChild]
				_, foundSP := entityPerTypeSource[entityTypeParent]
				_, foundTC := entityPerTypeTarget[entityTypeChild]
				_, foundTP := entityPerTypeTarget[entityTypeParent]

				if foundSC && foundSP && foundTC && foundTP {
					// pass
				} else {
					continue
				}

				entityMatchesChild, err := readMatchesCurrent(fs, matchParameters, entityTypeChild)
				if err != nil {
					return stats, err
				}

				entityMatchesParent, err := readMatchesCurrent(fs, matchParameters, entityTypeParent)
				if err != nil {
					return stats, err
				}

				if entityMatchesChild.calcMultiMatched() == 0 && entityMatchesParent.calcMultiMatched() == 0 {
					continue
				}

				log.Info("Processing Hierarchy: Type: %s, Child: %s, Parent: %s", sourceHierarchy.Name, entityTypeChild, entityTypeParent)

				entityProcessingPtrChild, err := genEntityProcessing(entityPerTypeSource, entityPerTypeTarget, entityTypeChild)
				if err != nil {
					return stats, err
				}

				entityProcessingPtrParent, err := genEntityProcessing(entityPerTypeSource, entityPerTypeTarget, entityTypeParent)
				if err != nil {
					return stats, err
				}

				childIdxToParentIdxSource := genChildIdxToParentIdx(&entityProcessingPtrChild.Source, &entityProcessingPtrParent.Source, sourceHierarchy)
				childIdxToParentIdxTarget := genChildIdxToParentIdx(&entityProcessingPtrChild.Target, &entityProcessingPtrParent.Target, sourceHierarchy)

				entityMatchesParent, entityMatchesChild = runRulesHierarchy(entityProcessingPtrChild, entityProcessingPtrParent, matchParameters, entityMatchesChild, entityMatchesParent, &childIdxToParentIdxSource, &childIdxToParentIdxTarget, sourceHierarchy)

				writeMatches(fs, matchParameters, entityTypeChild, entityMatchesChild)
				setStats(stats, entityTypeChild, entityMatchesChild, entityProcessingPtrChild)

				writeMatches(fs, matchParameters, entityTypeParent, entityMatchesParent)
				setStats(stats, entityTypeParent, entityMatchesParent, entityProcessingPtrParent)

			}
		}
	}

	log.Info("Processed Hierarchy rules in: %v", time.Since(startTime))

	return stats, nil
}

func genChildIdxToParentIdx(entityProcessingEnvPtrChild *match.MatchProcessingEnv, entityProcessingEnvPtrParent *match.MatchProcessingEnv, sourceHierarchy rules.HierarchySource) ChildIdxToParentIdx {
	matchListChild := *entityProcessingEnvPtrChild.RawMatchList.GetValues()
	childIdxToParentId := make([]ChildIdxParentId, 0, len(matchListChild))

	for idxChild, child := range matchListChild {
		parentIdList := match.GetValueFromPath(child, sourceHierarchy.Path)

		if parentIdList == nil {
			continue
		}

		stringValue, isString := parentIdList.(string)

		parentId := ""

		if isString {
			parentId = stringValue
		} else {
			sliceValue := parentIdList.([]interface{})

			for _, uniqueValue := range sliceValue {
				mapValue, isMap := uniqueValue.(map[string]interface{})
				if isMap {
					parentIdInterface, foundId := mapValue["id"]
					if foundId {
						parentId = parentIdInterface.(string)
						continue
					}
				}
			}
		}

		if parentId != "" {
			childIdxToParentId = append(childIdxToParentId, ChildIdxParentId{
				childIdx: idxChild,
				parentId: parentId,
			})
		}

	}

	sort.Sort(byParentId(childIdxToParentId))
	matchListParent := *entityProcessingEnvPtrParent.RawMatchList.GetValues()

	childIdxToParentIdx := make(ChildIdxToParentIdx, len(matchListChild))

	idxChildParent := 0
	idxParent := 0

	for idx := range childIdxToParentIdx {
		childIdxToParentIdx[idx] = -1
	}

	for idxChildParent < len(childIdxToParentId) && idxParent < len(matchListParent) {

		entityIdChildParent := childIdxToParentId[idxChildParent].parentId
		entityIdParent := matchListParent[idxParent].(map[string]interface{})["entityId"].(string)

		diff := strings.Compare(entityIdChildParent, entityIdParent)

		if diff < 0 {
			idxChildParent++
			continue
		}
		if diff > 0 {
			idxParent++
			continue
		}

		idxChild := childIdxToParentId[idxChildParent].childIdx
		childIdxToParentIdx[idxChild] = idxParent

		idxChildParent++

	}
	return childIdxToParentIdx
}

func getEntitiesTypesTarget(matchParameters match.MatchParameters) ([]client.EntitiesType, error) {
	environmentKey := ""
	for envKey := range matchParameters.Target.Manifest.Environments {
		environmentKey = envKey
		break
	}

	if environmentKey == "" {
		return nil, nil
	}

	dtClient, err := client.NewClassicClient(matchParameters.Target.Manifest.Environments[environmentKey].URL.Value, matchParameters.Target.Manifest.Environments[environmentKey].Auth.Token.Value)
	if err != nil {
		return nil, err
	}

	limitingDtClient := client.LimitClientParallelRequests(dtClient, 1)
	entitiesTypes, err := limitingDtClient.ListEntitiesTypes()
	if err != nil {
		return nil, err
	}

	return entitiesTypes, nil
}

func getChildToParentMap(sourceHierarchy rules.HierarchySource, entitiesTypes []client.EntitiesType) map[string][]string {
	childToParent := map[string][]string{}

	path := sourceHierarchy.Path

	for _, entitiesType := range entitiesTypes {
		if len(path) == 2 {
			topField := path[0]
			subField := path[1]

			reflectValue, found := client.L2FieldWithIdExists(entitiesType, topField, subField)

			if found {
				// pass
			} else {
				continue
			}

			toTypes := client.GetDynamicFieldFromMapReflection(reflectValue, "toTypes")

			if client.IsInvalidReflectionValue(toTypes) {
				continue
			}

			toTypesDereferenced := toTypes.Elem()

			if client.IsInvalidReflectionValue(toTypesDereferenced) {
				continue
			}

			for i := 0; i < toTypesDereferenced.Len(); i++ {
				element := toTypesDereferenced.Index(i)
				if client.IsInvalidReflectionValue(element) {
					continue
				}

				parentValue, isString := element.Interface().(string)

				if isString {
					_, exists := childToParent[entitiesType.EntitiesTypeId]

					if exists {
						// pass
					} else {
						childToParent[entitiesType.EntitiesTypeId] = []string{}
					}

					childToParent[entitiesType.EntitiesTypeId] = append(childToParent[entitiesType.EntitiesTypeId], parentValue)
				}
			}

		}
	}
	return childToParent
}
