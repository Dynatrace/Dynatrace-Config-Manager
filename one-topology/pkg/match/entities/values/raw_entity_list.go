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

package values

import (
	"runtime"
	"sort"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/mailru/easyjson"
)

type RawEntityList struct {
	Values *[]Value `json:"valueList"`
}

func (r *RawEntityList) Sort() {

	sort.Sort(ByRawEntityId(*r.Values))

}

func (r *RawEntityList) Len() int {

	return len(*r.GetValues())

}

func (r *RawEntityList) GetValues() *[]Value {

	return r.Values

}

func (r *RawEntityList) GetValuesConfig() *[]interface{} {

	panic("GetValues can only be called for configs")

}

type Value struct {
	EntityId         string             `json:"entityId,intern"`
	FirstSeenTms     *float64           `json:"firstSeenTms"`
	DisplayName      *string            `json:"displayName,intern"`
	Properties       *properties        `json:"properties"`
	FromRelationship *fromRelationships `json:"fromRelationships"`
}

type properties struct {
	DetectedName           string      `json:"detectedName,intern"`
	OneAgentCustomHostName *string     `json:"oneAgentCustomHostName,intern"`
	GeolocationCode        *string     `json:"geolocationCode,intern"`
	GeolocationType        *string     `json:"geolocationType,intern"`
	WebServiceName         *string     `json:"webServiceName,intern"`
	WebServiceNamespace    *string     `json:"webServiceNamespace,intern"`
	IpAddress              *[]string   `json:"ipAddress,intern"`
	InternalIpAddresses    *[]string   `json:"internalIpAddresses,intern"`
	Metadata               *[]Metadata `json:"metadata"`
}

type Metadata struct {
	Key   string `json:"key,intern"`
	Value string `json:"value,intern"`
}

type fromRelationships struct {
	RunsOnHost                   *[]Relation `json:"runsOnHost"`
	IsProcessOf                  *[]Relation `json:"isProcessOf"`
	RunsOn                       *[]Relation `json:"runsOn"`
	IsInstanceOf                 *[]Relation `json:"isInstanceOf"`
	IsCgiOfHost                  *[]Relation `json:"isCgiOfHost"`
	IsDiskOf                     *[]Relation `json:"isDiskOf"`
	IsStepOf                     *[]Relation `json:"isStepOf"`
	IsApplicationOfSyntheticTest *[]Relation `json:"isApplicationOfSyntheticTest"`
	IsGroupOf                    *[]Relation `json:"isGroupOf"`
	IsApplicationMethodOfGroup   *[]Relation `json:"isApplicationMethodOfGroup"`
	IsChildOf                    *[]Relation `json:"isChildOf"`
}

type Relation struct {
	Id string `json:"id,intern"`
}

// ByRawEntityId implements sort.Interface for []RawEntity] based on
// the EntityId string field.
type ByRawEntityId []Value

func (a ByRawEntityId) Len() int      { return len(a) }
func (a ByRawEntityId) Swap(i, j int) { a[i], a[j] = a[j], a[i] }
func (a ByRawEntityId) Less(i, j int) bool {
	return a[i].EntityId < a[j].EntityId
}

func UnmarshalEntities(entityPerType []config.Config, isHierarchy bool) (*RawEntityList, error) {
	rawEntityList := &RawEntityList{
		Values: &[]Value{},
	}
	var err error = nil

	if len(entityPerType) > 0 {

		prefix := []byte("{\"valueList\": ")
		suffix := []byte("}")
		templateBytes, err := entityPerType[0].LoadPaddedTemplateBytes(prefix, suffix)
		if err != nil {
			log.Error("Could not Load Template properly: %v", err)
			return nil, err
		}

		err = easyjson.Unmarshal(templateBytes, rawEntityList)
		if err != nil {
			log.Error("Could not Unmarshal properly: %v", err)
			return nil, err
		}

		runtime.GC()
	}

	return rawEntityList, err
}

func PrintMemUsage(label string) {
	runtime.GC()
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	log.Info("%s - Alloc = %v MiB, TotalAlloc = %v MiB, Sys = %v MiB, tNumGC = %v", label, m.Alloc/1024/1024, m.TotalAlloc/1024/1024, m.Sys/1024/1024, m.NumGC)
}
