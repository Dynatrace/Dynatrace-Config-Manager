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
	"fmt"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/client"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/processing"
	project "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/project/v2"
	"github.com/spf13/afero"
)

func MatchEntities(fs afero.Fs, matchParameters match.MatchParameters, entityPerTypeSource project.ConfigsPerType, entityPerTypeTarget project.ConfigsPerType) (map[string]string, int, int, error) {
	entitiesSourceCount := 0
	entitiesTargetCount := 0
	stats := map[string]string{}

	for entitiesType := range entityPerTypeTarget {

		log.Debug("Processing Type: %s", entitiesType)

		if entitiesType == client.TypesAsEntitiesType {
			continue
		}

		entityProcessingPtr, err := processing.GenEntityProcessing(entityPerTypeSource, entityPerTypeTarget, entitiesType, false)
		if err != nil {
			return map[string]string{}, 0, 0, err
		}
		prevMatches, err := readMatchesPrev(fs, matchParameters, entitiesType)
		if err != nil {
			return map[string]string{}, 0, 0, err
		}

		output := runRules(entityProcessingPtr, matchParameters, prevMatches)

		err = writeMatches(fs, matchParameters, entitiesType, output)
		if err != nil {
			return map[string]string{}, 0, 0, fmt.Errorf("failed to persist matches of type: %s, see error: %w", entitiesType, err)
		}

		entitiesSourceCount += entityProcessingPtr.Source.RawMatchList.Len()
		entitiesTargetCount += entityProcessingPtr.Target.RawMatchList.Len()
		stats = setStats(stats, entitiesType, output, entityProcessingPtr)
	}

	return stats, entitiesSourceCount, entitiesTargetCount, nil
}

func setStats(stats map[string]string, entitiesType string, output MatchOutputType, entityProcessingPtr *processing.MatchProcessing) map[string]string {
	stats[entitiesType] = fmt.Sprintf("%65s %10d %12d %10d %10d %10d", entitiesType, len(output.Matches), output.calcMultiMatched(), len(output.UnMatched), entityProcessingPtr.Target.RawMatchList.Len(), entityProcessingPtr.Source.RawMatchList.Len())
	return stats
}
