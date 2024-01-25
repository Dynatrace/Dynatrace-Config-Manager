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

package client

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/errutils"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/internal/log"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/api"
	"github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/rest"
)

func isReportsApi(api api.API) bool {
	return api.ID == "reports"
}

func getExistingValuesFromEndpoint(client *http.Client, theApi api.API, urlString string, retrySettings rest.RetrySettings) (values []Value, err error) {

	parsedUrl, err := url.Parse(urlString)
	if err != nil {
		return nil, fmt.Errorf("invalid URL for getting existing Dynatrace configs: %w", err)
	}

	parsedUrl = addQueryParamsForNonStandardApis(theApi, parsedUrl)

	resp, err := rest.Get(client, parsedUrl.String())

	if err != nil {
		return nil, err
	}

	if !success(resp) {
		return nil, fmt.Errorf("failed to get existing configs for API %s (HTTP %d)!\n    Response was: %s", theApi.ID, resp.StatusCode, string(resp.Body))
	}

	var existingValues []Value
	for {
		values, err := unmarshalJson(theApi, resp)
		if err != nil {
			return nil, err
		}
		existingValues = append(existingValues, values...)

		if resp.NextPageKey != "" {
			parsedUrl = rest.AddNextPageQueryParams(parsedUrl, resp.NextPageKey)

			resp, err = rest.GetWithRetry(client, parsedUrl.String(), retrySettings.Normal)

			if err != nil {
				return nil, err
			}

			if !success(resp) && resp.StatusCode != http.StatusBadRequest {
				return nil, fmt.Errorf("failed to get further configs from paginated API %s (HTTP %d)!\n    Response was: %s", theApi.ID, resp.StatusCode, string(resp.Body))
			} else if resp.StatusCode == http.StatusBadRequest {
				log.Warn("Failed to get additional data from paginated API %s - pages may have been removed during request.\n    Response was: %s", theApi.ID, string(resp.Body))
				break
			}

		} else {
			break
		}
	}

	return existingValues, nil
}

func addQueryParamsForNonStandardApis(theApi api.API, url *url.URL) *url.URL {

	queryParams := url.Query()
	if theApi.ID == "anomaly-detection-metrics" {
		queryParams.Add("includeEntityFilterMetricEvents", "true")
	}
	if theApi.ID == "slo" {
		queryParams.Add("enabledSlos", "all")
	}
	url.RawQuery = queryParams.Encode()
	return url
}

func unmarshalJson(theApi api.API, resp rest.Response) ([]Value, error) {

	var values []Value
	var objmap map[string]interface{}

	// This API returns an untyped list as a response -> it needs a special handling
	if theApi.ID == "aws-credentials" {

		var jsonResp []Value
		err := json.Unmarshal(resp.Body, &jsonResp)
		if errutils.CheckError(err, "Cannot unmarshal API response for existing aws-credentials") {
			return values, err
		}
		values = jsonResp

	} else {

		if theApi.ID == "synthetic-location" {

			var jsonResp SyntheticLocationResponse
			err := json.Unmarshal(resp.Body, &jsonResp)
			if errutils.CheckError(err, "Cannot unmarshal API response for existing synthetic location") {
				return nil, err
			}
			values = translateSyntheticValues(jsonResp.Locations)

		} else if theApi.ID == "synthetic-monitor" {

			var jsonResp SyntheticMonitorsResponse
			err := json.Unmarshal(resp.Body, &jsonResp)
			if errutils.CheckError(err, "Cannot unmarshal API response for existing synthetic location") {
				return nil, err
			}
			values = translateSyntheticValues(jsonResp.Monitors)

		} else if !theApi.IsStandardAPI() || isReportsApi(theApi) {

			if err := json.Unmarshal(resp.Body, &objmap); err != nil {
				return nil, err
			}

			if available, array := isResultArrayAvailable(objmap, theApi); available {
				jsonResp, err := translateGenericValues(array, theApi.ID)
				if err != nil {
					return nil, err
				}
				values = jsonResp
			}

		} else {

			var jsonResponse ValuesResponse
			err := json.Unmarshal(resp.Body, &jsonResponse)
			if errutils.CheckError(err, "Cannot unmarshal API response for existing objects") {
				return nil, err
			}
			values = jsonResponse.Values
		}
	}

	return values, nil
}

func isResultArrayAvailable(jsonResponse map[string]interface{}, theApi api.API) (resultArrayAvailable bool, results []interface{}) {
	if jsonResponse[theApi.PropertyNameOfGetAllResponse] != nil {
		return true, jsonResponse[theApi.PropertyNameOfGetAllResponse].([]interface{})
	}
	return false, make([]interface{}, 0)
}

func translateGenericValues(inputValues []interface{}, configType string) ([]Value, error) {

	values := make([]Value, 0, len(inputValues))

	for _, input := range inputValues {
		input := input.(map[string]interface{})

		if input["id"] == nil {
			return values, fmt.Errorf("config of type %s was invalid: No id", configType)
		}

		// Substitute missing name attribute
		if input["name"] == nil {
			jsonStr, err := json.Marshal(input)
			if err != nil {
				log.Warn("Config of type %s was invalid. Ignoring it!", configType)
				continue
			}

			substitutedName := ""

			// Differentiate handling for reports API from others
			isReportsApi := configType == "reports"
			if isReportsApi {
				// Substitute name with dashboard id since it is unique identifier for entity
				substitutedName = input["dashboardId"].(string)
				log.Debug("Rewriting response of config-type '%v', name missing. Using dashboardId as name. Invalid json: %v", configType, string(jsonStr))

			} else {
				// Substitute name with id since it is unique identifier for entity
				substitutedName = input["id"].(string)
				log.Debug("Rewriting response of config-type '%v', name missing. Using id as name. Invalid json: %v", configType, string(jsonStr))
			}

			values = append(values, Value{
				Id:   input["id"].(string),
				Name: substitutedName,
			})
			continue
		}

		value := Value{
			Id:   input["id"].(string),
			Name: input["name"].(string),
		}

		if v, ok := input["owner"].(string); ok {
			value.Owner = &v
		}

		values = append(values, value)
	}
	return values, nil
}

func translateSyntheticValues(syntheticValues []SyntheticValue) []Value {
	values := make([]Value, 0, len(syntheticValues))
	for _, loc := range syntheticValues {
		values = append(values, Value{
			Id:   loc.EntityId,
			Name: loc.Name,
		})
	}
	return values
}

func success(resp rest.Response) bool {
	return resp.StatusCode >= 200 && resp.StatusCode <= 299
}
