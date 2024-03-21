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

package processing

import (
	"sort"

	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	entitiesValues "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/entities/values"
	project "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/project/v2"
)

type MatchProcessing struct {
	Source     MatchProcessingEnv
	Target     MatchProcessingEnv
	matchedMap map[int]int
}

type RawMatchList interface {
	GetValues() *[]entitiesValues.Value
	GetValuesConfig() *[]interface{}
	Sort()
	Len() int
}
type ByRawItemId interface {
	Len() int
	Swap(i, j int)
	Less(i, j int) bool
}

func GenEntityProcessing(entityPerTypeSource project.ConfigsPerType, entityPerTypeTarget project.ConfigsPerType, entitiesType string, isHierarchy bool) (*MatchProcessing, error) {

	rawEntitiesSource, err := entitiesValues.UnmarshalEntities(entityPerTypeSource[entitiesType], isHierarchy)
	if err != nil {
		return nil, err
	}
	sourceType := config.EntityType{}
	if len(entityPerTypeSource[entitiesType]) > 0 {
		sourceType = entityPerTypeSource[entitiesType][0].Type.(config.EntityType)
	}

	rawEntitiesTarget, err := entitiesValues.UnmarshalEntities(entityPerTypeTarget[entitiesType], isHierarchy)
	if err != nil {
		return nil, err
	}
	targetType := config.EntityType{}
	if len(entityPerTypeTarget[entitiesType]) > 0 {
		targetType = entityPerTypeTarget[entitiesType][0].Type.(config.EntityType)
	}

	return NewMatchProcessing(rawEntitiesSource, sourceType, rawEntitiesTarget, targetType), nil
}

func NewMatchProcessing(rawMatchListSource RawMatchList, SourceType config.Type, rawMatchListTarget RawMatchList, TargetType config.Type) *MatchProcessing {
	e := new(MatchProcessing)
	e.matchedMap = map[int]int{}

	rawMatchListSource.Sort()
	rawMatchListTarget.Sort()

	e.Source = MatchProcessingEnv{
		RawMatchList:   rawMatchListSource,
		ConfigType:     SourceType,
		RemainingMatch: genRemainingMatchList(rawMatchListSource),
	}
	e.Target = MatchProcessingEnv{
		RawMatchList:   rawMatchListTarget,
		ConfigType:     TargetType,
		RemainingMatch: genRemainingMatchList(rawMatchListTarget),
	}

	return e
}

func genRemainingMatchList(rawMatchList RawMatchList) []int {
	remainingMatchList := make([]int, rawMatchList.Len())
	for i := 0; i < rawMatchList.Len(); i++ {
		remainingMatchList[i] = i
	}

	return remainingMatchList
}

func (e *MatchProcessing) GetConfigType() config.Type {

	var conf config.Type

	if e.Target.ConfigType == nil {
		conf = e.Source.ConfigType
	} else {
		conf = e.Target.ConfigType
	}

	return conf
}

func (e *MatchProcessing) GetType() string {

	conf := e.GetConfigType()

	entityType, ok := conf.(config.EntityType)
	if ok {
		return entityType.EntitiesType
	}

	settingsType, ok := conf.(config.SettingsType)
	if ok {
		return settingsType.SchemaId
	}

	classicType, ok := conf.(config.ClassicApiType)
	if ok {
		return classicType.Api
	}

	return ""
}

func (e *MatchProcessing) AdjustremainingMatch(uniqueMatch *[]CompareResult) {

	sort.Sort(ByLeft(*uniqueMatch))
	e.Source.reduceRemainingMatchList(uniqueMatch, getLeftId)
	sort.Sort(ByRight(*uniqueMatch))
	e.Target.reduceRemainingMatchList(uniqueMatch, getRightId)

}

func (e *MatchProcessing) PrepareRemainingMatch(keepSeeded bool, keepUnseeded bool, resultListPtr *CompareResultList) {

	if keepSeeded && keepUnseeded {
		e.Source.CurrentRemainingMatch = &(e.Source.RemainingMatch)
		e.Target.CurrentRemainingMatch = &(e.Target.RemainingMatch)
	} else if keepSeeded {
		sort.Sort(ByLeft(resultListPtr.CompareResults))
		e.Source.genSeededMatch(&resultListPtr.CompareResults, getLeftId)

		sort.Sort(ByRight(resultListPtr.CompareResults))
		e.Target.genSeededMatch(&resultListPtr.CompareResults, getRightId)
	} else if keepUnseeded {
		sort.Sort(ByLeft(resultListPtr.CompareResults))
		e.Source.genUnSeededMatch(&resultListPtr.CompareResults, getLeftId)

		sort.Sort(ByRight(resultListPtr.CompareResults))
		e.Target.genUnSeededMatch(&resultListPtr.CompareResults, getRightId)
	}

}
