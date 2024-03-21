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
	"encoding/json"
	"runtime"
	"time"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/mailru/easyjson"
)

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
		startTime := time.Now()

		PrintMemUsage("Before")
		err = json.Unmarshal([]byte(entityPerType[0].Template.Content()), rawEntityList.Values)
		log.Info("Unmarshal original in: %v", time.Since(startTime))
		startTime = time.Now()

		PrintMemUsage("After Original")
		err2 := easyjson.Unmarshal([]byte("{\"valueList\": "+entityPerType[0].Template.Content()+"}"), rawEntityList)
		log.Info("Unmarshal new in: %v", time.Since(startTime))
		log.Info("AAAAA: ", err2, (*rawEntityList.Values)[0])
		PrintMemUsage("After New")
	}

	return rawEntityList, err
}

func PrintMemUsage(label string) {
	var m runtime.MemStats
	runtime.GC()
	time.Sleep(1)
	runtime.ReadMemStats(&m)
	log.Info("%s - Alloc = %v MiB, TotalAlloc = %v MiB, Sys = %v MiB, tNumGC = %v\n", label, m.Alloc/1024/1024, m.TotalAlloc/1024/1024, m.Sys/1024/1024, m.NumGC)
}
