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
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/cmd/monaco/cmdutils"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/errutils"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/manifest"
	"github.com/spf13/afero"
	"gopkg.in/yaml.v2"
)

var validMatchTypes = map[string]bool{
	"entities": true,
	"configs":  true,
}

const (
	ACTION_ADD         = "Add"
	ACTION_DELETE      = "Delete"
	ACTION_UPDATE      = "Update"
	ACTION_IDENTICAL   = "Identical"
	ACTION_PREEMPTIVE  = "Preemptive"
	STATUS_MULTI_MATCH = "Multi Matched"

	ACTION_ADD_RUNE         = 'A'
	ACTION_DELETE_RUNE      = 'D'
	ACTION_UPDATE_RUNE      = 'U'
	ACTION_IDENTICAL_RUNE   = 'I'
	ACTION_PREEMPTIVE_RUNE  = 'P'
	STATUS_MULTI_MATCH_RUNE = 'M'
)

var ActionMap = map[string]rune{
	ACTION_ADD:        ACTION_ADD_RUNE,
	ACTION_DELETE:     ACTION_DELETE_RUNE,
	ACTION_UPDATE:     ACTION_UPDATE_RUNE,
	ACTION_IDENTICAL:  ACTION_IDENTICAL_RUNE,
	ACTION_PREEMPTIVE: ACTION_PREEMPTIVE_RUNE,
}

const SOURCE_ENV = "Source"
const TARGET_ENV = "Target"

type matchLoaderContext struct {
	fs            afero.Fs
	matchFilePath string
}

type MatchParameters struct {
	Name              string
	Type              string
	WorkingDir        string
	OutputDir         string
	PrevResultDir     string
	ReplacementsDir   string
	EntitiesMatchDir  string
	SkipSpecificTypes bool
	SpecificTypes     []string
	SpecificActions   []rune
	SelfMatch         bool
	Source            MatchParametersEnv
	Target            MatchParametersEnv
}

type MatchParametersEnv struct {
	EnvType     string
	WorkingDir  string
	Project     string
	Environment string
	Manifest    manifest.Manifest
}

type MatchFileDefinition struct {
	Name              string            `yaml:"name"`
	Type              string            `yaml:"type"`
	EntitiesMatchPath string            `yaml:"entitiesMatchPath,omitempty"`
	OutputPath        string            `yaml:"outputPath"`
	PrevResultPath    string            `yaml:"prevResultPath,omitempty"`
	ReplacementsPath  string            `yaml:"replacementsPath"`
	SkipSpecificTypes bool              `yaml:"skipSpecificTypes,omitempty"`
	SpecificTypes     []string          `yaml:"specificTypes,omitempty"`
	SpecificActions   []string          `yaml:"specificActions,omitempty"`
	SelfMatch         bool              `yaml:"selfMatch"`
	Source            EnvInfoDefinition `yaml:"sourceInfo"`
	Target            EnvInfoDefinition `yaml:"targetInfo"`
}

type EnvInfoDefinition struct {
	ManifestPath string `yaml:"manifestPath"`
	Project      string `yaml:"project"`
	Environment  string `yaml:"environment"`
}

type MatchEntryParserError struct {
	Value  string
	Index  int
	Reason string
}

func getParameterEnv(context *matchLoaderContext, matchInfoDef EnvInfoDefinition, envType string) (MatchParametersEnv, []error) {
	matchParametersEnv := MatchParametersEnv{}
	var errors []error

	man, err := cmdutils.GetManifest(context.fs, matchInfoDef.ManifestPath)
	if err != nil {
		errors = append(errors, err)
	} else {
		matchParametersEnv.Manifest = man
	}

	workingDir, _, err := cmdutils.GetFilePaths(matchInfoDef.ManifestPath)
	if err != nil {
		errors = append(errors, err)
	} else {
		matchParametersEnv.WorkingDir = workingDir
	}

	matchParametersEnv.EnvType = envType
	matchParametersEnv.Project = matchInfoDef.Project
	matchParametersEnv.Environment = matchInfoDef.Environment

	return matchParametersEnv, errors

}

func getMapKeys(theMap map[string]bool) []string {
	keys := make([]string, len(theMap))

	i := 0
	for k := range theMap {
		keys[i] = k
		i++
	}

	return keys
}

func parseMatchFile(context *matchLoaderContext) (MatchFileDefinition, error) {

	data, err := afero.ReadFile(context.fs, context.matchFilePath)

	if err != nil {
		return MatchFileDefinition{}, err
	}

	if len(data) == 0 {
		return MatchFileDefinition{}, fmt.Errorf("file `%s` is empty", context.matchFilePath)
	}

	var result MatchFileDefinition

	err = yaml.UnmarshalStrict(data, &result)

	if err != nil {
		return MatchFileDefinition{}, err
	}

	return result, nil
}

func LoadMatchingParameters(fs afero.Fs, matchFileName string) (matchParameters MatchParameters, err error) {
	matchWorkingDir, matchFilePath, err := cmdutils.GetFilePaths(matchFileName)
	if err != nil {
		return
	}
	matchParameters.WorkingDir = matchWorkingDir

	context := &matchLoaderContext{
		fs:            fs,
		matchFilePath: matchFilePath,
	}

	matchFileDef, err := parseMatchFile(context)
	if err != nil {
		return
	}

	var errors []error

	if matchFileDef.Name == "" {
		errors = append(errors, fmt.Errorf("matches should be named"))
	} else {
		matchParameters.Name = matchFileDef.Name
	}

	if validMatchTypes[matchFileDef.Type] {
		matchParameters.Type = matchFileDef.Type
	} else {
		errors = append(errors, fmt.Errorf("matches type should be: %s, but was: %s", strings.Join(getMapKeys(validMatchTypes), " or "), matchFileDef.Type))
	}

	_, ouputDir, err := cmdutils.GetFilePaths(matchFileDef.OutputPath)
	if err != nil {
		errors = append(errors, err)
	} else {

		sanitizedOutputDir := filepath.Clean(ouputDir)
		err := os.RemoveAll(sanitizedOutputDir)
		if err != nil {
			errors = append(errors, err)
		} else {
			matchParameters.OutputDir = sanitizedOutputDir
			log.Info("Output Directory: %s", matchParameters.OutputDir)
		}
	}

	_, prevResultDir, err := cmdutils.GetFilePaths(matchFileDef.PrevResultPath)
	if err != nil {
		errors = append(errors, err)
	} else {
		matchParameters.PrevResultDir = prevResultDir
		log.Info("Previous Result Directory: %s", matchParameters.PrevResultDir)
	}

	_, replacementsDir, err := cmdutils.GetFilePaths(matchFileDef.ReplacementsPath)
	if err != nil {
		errors = append(errors, err)
	} else {
		matchParameters.ReplacementsDir = replacementsDir
		log.Info("Replacements Directory: %s", matchParameters.ReplacementsDir)
	}

	_, entitiesMatchDir, err := cmdutils.GetFilePaths(matchFileDef.EntitiesMatchPath)
	if err != nil {
		errors = append(errors, err)
	} else {
		matchParameters.EntitiesMatchDir = entitiesMatchDir
		log.Info("Entities Match Directory: %s", matchParameters.EntitiesMatchDir)
	}

	if matchFileDef.SkipSpecificTypes {
		matchParameters.SkipSpecificTypes = matchFileDef.SkipSpecificTypes
	}

	if len(matchFileDef.SpecificTypes) > 0 {
		matchParameters.SpecificTypes = matchFileDef.SpecificTypes
	}

	if len(matchFileDef.SpecificActions) > 0 {
		matchParameters.SpecificActions = make([]rune, len(matchFileDef.SpecificActions))
		for i, actionLabel := range matchFileDef.SpecificActions {

			actionRune, ok := ActionMap[actionLabel]
			if ok {
				matchParameters.SpecificActions[i] = actionRune
			} else {
				errors = append(errors, fmt.Errorf("specific action does not exist: %s", actionLabel))
			}
		}
	}

	var errList []error
	matchParameters.Source, errList = getParameterEnv(context, matchFileDef.Source, SOURCE_ENV)

	if errList != nil {
		errors = append(errors, errList...)
	}

	matchParameters.Target, errList = getParameterEnv(context, matchFileDef.Target, TARGET_ENV)

	if errList != nil {
		errors = append(errors, errList...)
	}

	matchParameters.SelfMatch = matchFileDef.SelfMatch

	if matchFileDef.Source.ManifestPath == matchFileDef.Target.ManifestPath &&
		matchFileDef.Source.Environment == matchFileDef.Target.Environment &&
		matchFileDef.Source.Project == matchFileDef.Target.Project {

		matchParameters.SelfMatch = true
	}
	if matchParameters.SelfMatch {
		log.Debug("This is a Self Match, some rules will be disabled.")
	}

	if len(errors) > 0 {
		err = errutils.PrintAndFormatErrors(errors, "Could not load Config Parameters, see errors for details")
	}

	return
}

func GetRuneLabelMap() map[string]string {
	return reverseMap(ActionMap)
}

func reverseMap(m map[string]rune) map[string]string {
	reversed := make(map[string]string)

	for key, value := range m {
		reversed[string(value)] = key
	}

	return reversed
}
