// @license
// Copyright 2021 Dynatrace LLC
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
	"fmt"
	"sort"
	"time"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/errutils"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/maps"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/api"
	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match"
	matchConfigs "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/configs"
	matchEntities "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/entities"
	project "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/project/v2"
	"github.com/spf13/afero"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

//go:generate mockgen -source=match.go -destination=match_mock.go -package=match -write_package_comment=false Command

// Command is used to test the CLi commands properly without executing the actual monaco match.
//
// The actual implementations are in the [DefaultCommand] struct.
type Command interface {
	Match(fs afero.Fs, matchFileName string) error
}

// DefaultCommand is used to implement the [Command] interface.
type DefaultCommand struct{}

// make sure DefaultCommand implements the Command interface
var (
	_ Command = (*DefaultCommand)(nil)
)

func (d DefaultCommand) Match(fs afero.Fs, matchFileName string) error {

	startTime := time.Now()

	matchParameters, err := match.LoadMatchingParameters(fs, matchFileName)
	if err != nil {
		return err
	}

	configsSource, configsTarget, err := loadProjects(fs, matchParameters)
	if err != nil {
		return err
	}

	if matchParameters.Type == "entities" {

		err = runAndPrintMatchEntities(fs, matchParameters, configsSource, configsTarget, startTime)
		if err != nil {
			return err
		}

	} else if matchParameters.Type == "configs" {

		err = runAndPrintMatchConfigs(fs, matchParameters, configsSource, configsTarget, startTime)
		if err != nil {
			return err
		}

	}

	return nil
}

var STATS_HEADER = fmt.Sprintf("%65s %10s %12s %10s %10s %10s", "Type", "Matched", "MultiMatched", "UnMatched", "Total", "Source")

func runAndPrintMatchEntities(fs afero.Fs, matchParameters match.MatchParameters, configsSource project.ConfigsPerType, configsTarget project.ConfigsPerType, startTime time.Time) error {

	stats, entitiesSourceCount, entitiesTargetCount, err := matchEntities.MatchEntities(fs, matchParameters, configsSource, configsTarget)
	if err != nil {
		return err
	}

	printSortedStatsWithHeader(stats)

	p := message.NewPrinter(language.English)
	log.Info("Finished matching %d entity types, %s source entities and %s target entities in %v (pre-hierarchy)",
		len(configsSource), p.Sprintf("%d", entitiesSourceCount), p.Sprintf("%d", entitiesTargetCount), time.Since(startTime))

	// get ALL entities types
	stats, err = matchEntities.MatchEntitiesHierarchy(fs, matchParameters, configsSource, configsTarget, stats)
	if err != nil {
		return err
	}
	printSortedStatsWithHeader(stats)

	log.Info("Finished matching %d entity types, %s source entities and %s target entities in %v",
		len(configsSource), p.Sprintf("%d", entitiesSourceCount), p.Sprintf("%d", entitiesTargetCount), time.Since(startTime))

	return nil
}

func runAndPrintMatchConfigs(fs afero.Fs, matchParameters match.MatchParameters, configsSource project.ConfigsPerType, configsTarget project.ConfigsPerType, startTime time.Time) error {

	stats, configsSourceCount, configsTargetCount, err := matchConfigs.MatchConfigs(fs, matchParameters, configsSource, configsTarget)
	if err != nil {
		return err
	}

	for _, stat := range stats {
		log.Info(stat)
	}

	p := message.NewPrinter(language.English)
	log.Info("Finished matching %d config schemas, %s source configs and %s target configs in %v",
		len(configsSource), p.Sprintf("%d", configsSourceCount), p.Sprintf("%d", configsTargetCount), time.Since(startTime))

	return nil
}

func printSortedStatsWithHeader(stats map[string]string) {
	log.Info(STATS_HEADER)

	var keys []string
	for key := range stats {
		keys = append(keys, key)
	}

	sort.Strings(keys)

	for _, key := range keys {
		log.Info(stats[key])
	}
}

func loadProjects(fs afero.Fs, matchParameters match.MatchParameters) (project.ConfigsPerType, project.ConfigsPerType, error) {

	sourceConfigs, err := loadProject(fs, matchParameters.Source)
	if err != nil {
		return nil, nil, err
	}

	targetConfigs, err := loadProject(fs, matchParameters.Target)
	if err != nil {
		return nil, nil, err
	}

	return sourceConfigs, targetConfigs, nil

}

func loadProject(fs afero.Fs, env match.MatchParametersEnv) (project.ConfigsPerType, error) {

	log.Info("Loading project %s of %s environment %s ...", env.Project, env.EnvType, env.Environment)

	context := project.ProjectLoaderContext{
		KnownApis:       api.NewAPIs().GetApiNameLookup(),
		WorkingDir:      env.WorkingDir,
		Manifest:        env.Manifest,
		ParametersSerde: config.DefaultParameterParsers,
	}

	projects, errs := project.LoadProjectsSpecific(fs, context, []string{env.Project}, []string{env.Environment})

	if errs != nil {
		return nil, errutils.PrintAndFormatErrors(errs, "could not load projects from manifest")
	}

	projectCount := len(projects)
	if projectCount != 1 {
		return nil, fmt.Errorf("loaded %d projects for project: %s and environment: %s, expected 1 project to compare for %s environment",
			projectCount, env.Project, env.Environment, env.EnvType)
	}

	project := projects[0]
	envsInProjectCount := len(maps.Keys(project.Configs))
	if envsInProjectCount != 1 {
		return nil, fmt.Errorf("loaded %d environments for project: %s and environment: %s, expected 1 environment to compare for %s environment: List: %v",
			envsInProjectCount, env.Project, env.Environment, env.EnvType, maps.Keys(project.Configs))
	}

	envConfigs := project.Configs[env.Environment]

	log.Info("Loaded %d config types for %s environment %s, config types: %v",
		len(maps.Keys(envConfigs)), env.EnvType, env.Environment, maps.Keys(envConfigs))

	return envConfigs, nil

}
