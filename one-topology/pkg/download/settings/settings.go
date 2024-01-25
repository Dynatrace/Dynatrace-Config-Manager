/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package settings

import (
	"errors"
	"sync"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/idutils"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/client"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/download/entities"

	config "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2/coordinate"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2/parameter"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2/parameter/value"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/config/v2/template"
	v2 "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/project/v2"
)

// Downloader is responsible for downloading Settings 2.0 objects
type Downloader struct {
	// client is the settings 2.0 client to be used by the Downloader
	client client.SettingsClient

	// filters specifies which settings 2.0 objects need special treatment under
	// certain conditions and need to be skipped
	filters Filters
}

// WithFilters sets specific settings filters for settings 2.0 object that needs to be filtered following
// to some custom criteria
func WithFilters(filters Filters) func(*Downloader) {
	return func(d *Downloader) {
		d.filters = filters
	}
}

// NewSettingsDownloader creates a new downloader for Settings 2.0 objects
func NewSettingsDownloader(client client.SettingsClient, opts ...func(*Downloader)) *Downloader {
	d := &Downloader{
		client:  client,
		filters: defaultSettingsFilters,
	}
	for _, o := range opts {
		o(d)
	}
	return d
}

// Download downloads all settings 2.0 objects for the given schema IDs

func Download(client client.SettingsClient, schemaIDs []string, projectName string, flatDump bool) v2.ConfigsPerType {
	return NewSettingsDownloader(client).Download(schemaIDs, projectName, flatDump)
}

// DownloadAll downloads all settings 2.0 objects for a given project
func DownloadAll(client client.SettingsClient, projectName string, flatDump bool) v2.ConfigsPerType {
	return NewSettingsDownloader(client).DownloadAll(projectName, flatDump)
}

// Download downloads all settings 2.0 objects for the given schema IDs and a given project
// The returned value is a map of settings 2.0 objects with the schema ID as keys
func (d *Downloader) Download(schemaIDs []string, projectName string, flatDump bool) v2.ConfigsPerType {
	return d.download(schemaIDs, projectName, flatDump)
}

// DownloadAll downloads all settings 2.0 objects for a given project.
// The returned value is a map of settings 2.0 objects with the schema ID as keys
func (d *Downloader) DownloadAll(projectName string, flatDump bool) v2.ConfigsPerType {
	log.Debug("Fetching all schemas to download")

	// get ALL schemas
	schemas, err := d.client.ListSchemas()
	if err != nil {
		log.Error("Failed to fetch all known schemas. Skipping settings download. Reason: %s", err)
		return nil
	}
	// convert to list of IDs
	var ids []string
	for _, i := range schemas {
		ids = append(ids, i.SchemaId)
	}

	return d.download(ids, projectName, flatDump)
}

func (d *Downloader) download(schemas []string, projectName string, flatDump bool) v2.ConfigsPerType {
	results := make(v2.ConfigsPerType, len(schemas))
	downloadMutex := sync.Mutex{}
	wg := sync.WaitGroup{}
	wg.Add(len(schemas))
	for _, schema := range schemas {
		go func(s string) {
			defer wg.Done()
			log.Debug("Downloading all settings for schema %s", s)

			var configs []config.Config

			if flatDump {
				configs = d.downloadFlat(s, projectName)
			}

			if configs == nil {
				return
			}

			downloadMutex.Lock()
			results[s] = configs
			downloadMutex.Unlock()

			log.Debug("Finished downloading all (%d) settings for schema %s", len(configs), s)
		}(schema)
	}
	wg.Wait()

	return results
}

func (d *Downloader) downloadFlat(schema string, projectName string) []config.Config {
	objects, err := d.client.ListSettingsFlat(schema, client.ListSettingsOptions{})

	if err != nil {
		printDownloadError(err, schema)
		return nil
	}

	if len(objects) == 0 {
		return nil
	}

	log.Info("Downloaded %d settings for schema %s", len(objects), schema)

	configs := d.convertAllObjectsFlat(objects, schema, projectName)

	return configs
}

func printDownloadError(err error, schema string) {
	var errMsg string
	var respErr client.RespError

	if errors.As(err, &respErr) {
		errMsg = respErr.ConcurrentError()
	} else {
		errMsg = err.Error()
	}

	log.Error("Failed to fetch all settings for schema %s: %v", schema, errMsg)
}

func (d *Downloader) convertAllObjectsFlat(objects []string, schemaId string, projectName string) []config.Config {

	content := entities.JoinJsonElementsToArray(objects)

	templ := template.NewDownloadTemplate(schemaId, schemaId, content)

	configId := idutils.GenerateUuidFromName(schemaId)

	return []config.Config{{
		Template: templ,
		Coordinate: coordinate.Coordinate{
			Project:  projectName,
			Type:     schemaId,
			ConfigId: configId,
		},
		Type: config.SettingsType{
			SchemaId: schemaId,
		},
		Parameters: map[string]parameter.Parameter{
			config.NameParameter:  &value.ValueParameter{Value: configId},
			config.ScopeParameter: &value.ValueParameter{Value: "flatDump"},
		},
		Skip: false,
	}}

}
