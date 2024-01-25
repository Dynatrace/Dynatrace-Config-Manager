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
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/dynatrace/dynatrace-configuration-as-code/internal/log"
	"github.com/dynatrace/dynatrace-configuration-as-code/internal/throttle"
	"github.com/dynatrace/dynatrace-configuration-as-code/internal/version"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/api"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/match/rules"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/oauth2/endpoints"
	"github.com/dynatrace/dynatrace-configuration-as-code/pkg/rest"
	version2 "github.com/dynatrace/dynatrace-configuration-as-code/pkg/version"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

// ConfigClient is responsible for the classic Dynatrace configs. For settings objects, the [SettingsClient] is responsible.
// Each config endpoint is described by an [API] object to describe endpoints, structure, and behavior.
type ConfigClient interface {
	// ListConfigs lists the available configs for an API.
	// It calls the underlying GET endpoint of the API. E.g. for alerting profiles this would be:
	//    GET <environment-url>/api/config/v1/alertingProfiles
	// The result is expressed using a list of Value (id and name tuples).
	ListConfigs(a api.API) (values []Value, err error)

	// ReadConfigById reads a Dynatrace config identified by id from the given API.
	// It calls the underlying GET endpoint for the API. E.g. for alerting profiles this would be:
	//    GET <environment-url>/api/config/v1/alertingProfiles/<id> ... to get the alerting profile
	ReadConfigById(a api.API, id string) (json []byte, err error)
	ReadConfigByIdSubId(a api.API, id string, subId string) (json []byte, err error)
}

// DownloadSettingsObject is the response type for the ListSettings operation
type DownloadSettingsObject struct {
	ExternalId    string          `json:"externalId"`
	SchemaVersion string          `json:"schemaVersion"`
	SchemaId      string          `json:"schemaId"`
	ObjectId      string          `json:"objectId"`
	Scope         string          `json:"scope"`
	Value         json.RawMessage `json:"value"`
}

type SettingsResponseRaw struct {
	Settings []map[string]interface{} `json:"items"`
}

// ErrSettingNotFound is returned when no settings 2.0 object could be found
var ErrSettingNotFound = errors.New("settings object not found")

// SettingsClient is the abstraction layer for CRUD operations on the Dynatrace Settings API.
// Its design is intentionally not dependent on Monaco objects.
//
// This interface exclusively accesses the [settings api] of Dynatrace.
//
// The base mechanism for all methods is the same:
// We identify objects to be updated/deleted by their external-id. If an object can not be found using its external-id, we assume
// that it does not exist.
// More documentation is written in each method's documentation.
//
// [settings api]: https://www.dynatrace.com/support/help/dynatrace-api/environment-api/settings
type SettingsClient interface {

	// ListSchemas returns all schemas that the Dynatrace environment reports
	ListSchemas() (SchemaList, error)

	// ListSettings returns all settings objects for a given schema in a flat unformatted file.
	ListSettingsFlat(string, ListSettingsOptions) ([]string, error)
}

// defaultListSettingsFields  are the fields we are interested in when getting setting objects
const defaultListSettingsFields = "objectId,value,externalId,schemaVersion,schemaId,scope"

// reducedListSettingsFields are the fields we are interested in when getting settings objects but don't care about the
// actual value payload
const reducedListSettingsFields = "objectId,externalId,schemaVersion,schemaId,scope"
const defaultPageSize = "500"
const defaultPageSizeEntities = "4000"

const DefaultEntityWeeksTimeframeFrom = 7
const DefaultEntityMinutesTimeframeFrom = DefaultEntityWeeksTimeframeFrom * 7 * 24 * 60

// Not extracting the last 10 minutes to make sure what we extract is stable
// And avoid extracting more entities than the TotalCount from the first page of extraction
const DefaultEntityMinutesTimeframeTo = 0
const DefaultEntityDurationTimeframeTo = DefaultEntityMinutesTimeframeTo * time.Minute

// ListSettingsOptions are additional options for the ListSettings method
// of the Settings client
type ListSettingsOptions struct {
	// DiscardValue specifies whether the value field of the returned
	// settings object shall be included in the payload
	DiscardValue bool
	// ListSettingsFilter can be set to pre-filter the result given a special logic
	Filter ListSettingsFilter
}

// ListSettingsFilter can be used to filter fetched settings objects with custom criteria, e.g. o.ExternalId == ""
type ListSettingsFilter func(DownloadSettingsObject) bool

// EntitiesClient is the abstraction layer for read-only operations on the Dynatrace Entities v2 API.
// Its design is intentionally not dependent on Monaco objects.
//
// This interface exclusively accesses the [entities api] of Dynatrace.
//
// More documentation is written in each method's documentation.
//
// [entities api]: https://www.dynatrace.com/support/help/dynatrace-api/environment-api/entity-v2
type EntitiesClient interface {

	// ListEntitiesTypes returns all entities types
	ListEntitiesTypes() ([]EntitiesType, error)

	// ListEntities returns all entities objects for a given type.
	ListEntities(EntitiesType, int, int) (EntitiesList, error)
}

//go:generate mockgen -source=client.go -destination=client_mock.go -package=client DynatraceClient

// Client provides the functionality for performing basic CRUD operations on any Dynatrace API
// supported by monaco.
// It encapsulates the configuration-specific inconsistencies of certain APIs in one place to provide
// a common interface to work with. After all: A user of Client shouldn't care about the
// implementation details of each individual Dynatrace API.
// Its design is intentionally not dependent on the Config and Environment interfaces included in monaco.
// This makes sure, that Client can be used as a base for future tooling, which relies on
// a standardized way to access Dynatrace APIs.
type Client interface {
	ConfigClient
	SettingsClient
	EntitiesClient
}

// DynatraceClient is the default implementation of the HTTP
// client targeting the relevant Dynatrace APIs for Monaco
type DynatraceClient struct {
	// serverVersion is the Dynatrace server version the
	// client will be interacting with
	serverVersion version.Version
	// environmentURL is the base URL of the Dynatrace server the
	// client will be interacting with
	environmentURL string
	// environmentURLClassic is the base URL of the classic generation
	// Dynatrace tenant
	environmentURLClassic string
	// client is the underlying HTTP client that will be used to communicate
	// with platform gen environments
	client *http.Client

	// client is the underlying HTTP client that will be used to communicate
	// with second gen environments
	clientClassic *http.Client
	// retrySettings specify the retry behavior of the dynatrace client in case something goes wrong

	// settingsSchemaAPIPath is the API path to use for accessing settings schemas
	settingsSchemaAPIPath string

	//  settingsObjectAPIPath is the API path to use for accessing settings objects
	settingsObjectAPIPath string

	retrySettings rest.RetrySettings
}

// OauthCredentials holds information for authenticating to Dynatrace
// using Oauth2.0 client credential flow
type OauthCredentials struct {
	ClientID     string
	ClientSecret string
	TokenURL     string
	Scopes       []string
}

var (
	_ EntitiesClient = (*DynatraceClient)(nil)
	_ SettingsClient = (*DynatraceClient)(nil)
	_ ConfigClient   = (*DynatraceClient)(nil)
	_ Client         = (*DynatraceClient)(nil)
)

// WithRetrySettings sets the retry settings to be used by the DynatraceClient
func WithRetrySettings(retrySettings rest.RetrySettings) func(*DynatraceClient) {
	return func(d *DynatraceClient) {
		d.retrySettings = retrySettings
	}
}

// WithServerVersion sets the Dynatrace version of the Dynatrace server/tenant the client will be interacting with
func WithServerVersion(serverVersion version.Version) func(client *DynatraceClient) {
	return func(d *DynatraceClient) {
		d.serverVersion = serverVersion
	}
}

// WithAutoServerVersion can be used to let the client automatically determine the Dynatrace server version
// during creation using newDynatraceClient. If the server version is already known WithServerVersion should be used
func WithAutoServerVersion() func(client *DynatraceClient) {
	return func(d *DynatraceClient) {
		var serverVersion version.Version
		var err error
		if _, ok := d.client.Transport.(*oauth2.Transport); ok {
			// for platform enabled tenants there is no dedicated version endpoint
			// so this call would need to be "redirected" to the second gen URL, which do not currently resolve
			d.serverVersion = version.UnknownVersion
		} else {
			serverVersion, err = GetDynatraceVersion(d.clientClassic, d.environmentURLClassic)
		}
		if err != nil {
			log.Warn("Unable to determine Dynatrace server version: %v", err)
			d.serverVersion = version.UnknownVersion
		} else {
			d.serverVersion = serverVersion
		}
	}
}

// TokenAuthTransport should be used to enable a client
// to use dynatrace token authorization
type TokenAuthTransport struct {
	http.RoundTripper
	header http.Header
}

// NewTokenAuthTransport creates a new http transport to be used for
// token authorization
func NewTokenAuthTransport(baseTransport http.RoundTripper, token string) *TokenAuthTransport {
	if baseTransport == nil {
		baseTransport = http.DefaultTransport
	}
	t := &TokenAuthTransport{
		RoundTripper: baseTransport,
		header:       http.Header{},
	}
	t.setHeader("Authorization", "Api-Token "+token)
	t.setHeader("User-Agent", "Dynatrace Monitoring as Code/"+version2.MonitoringAsCode+" "+(runtime.GOOS+" "+runtime.GOARCH))
	return t
}

func (t *TokenAuthTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Add the custom headers to the request
	for k, v := range t.header {
		req.Header[k] = v
	}
	return t.RoundTripper.RoundTrip(req)
}

func (t *TokenAuthTransport) setHeader(key, value string) {
	t.header.Set(key, value)
}

var defaultOAuthTokenURL = endpoints.Dynatrace.TokenURL

// NewTokenAuthClient creates a new HTTP client that supports token based authorization
func NewTokenAuthClient(token string) *http.Client {
	if !isNewDynatraceTokenFormat(token) {
		log.Warn("You used an old token format. Please consider switching to the new 1.205+ token format.")
		log.Warn("More information: https://www.dynatrace.com/support/help/dynatrace-api/basics/dynatrace-api-authentication")
	}
	return &http.Client{Transport: NewTokenAuthTransport(nil, token)}
}

// NewOAuthClient creates a new HTTP client that supports OAuth2 client credentials based authorization
func NewOAuthClient(ctx context.Context, oauthConfig OauthCredentials) *http.Client {

	tokenUrl := oauthConfig.TokenURL
	if tokenUrl == "" {
		log.Debug("using default tokenURL %s", tokenUrl)
		tokenUrl = defaultOAuthTokenURL
	}

	config := clientcredentials.Config{
		ClientID:     oauthConfig.ClientID,
		ClientSecret: oauthConfig.ClientSecret,
		TokenURL:     tokenUrl,
		Scopes:       oauthConfig.Scopes,
	}

	return config.Client(ctx)
}

const (
	settingsSchemaAPIPathClassic  = "/api/v2/settings/schemas"
	settingsSchemaAPIPathPlatform = "/platform/classic/environment-api/v2/settings/schemas"
	settingsObjectAPIPathClassic  = "/api/v2/settings/objects"
	settingsObjectAPIPathPlatform = "/platform/classic/environment-api/v2/settings/objects"
)

// NewPlatformClient creates a new dynatrace client to be used for platform enabled environments
func NewPlatformClient(dtURL string, token string, oauthCredentials OauthCredentials, opts ...func(dynatraceClient *DynatraceClient)) (*DynatraceClient, error) {
	dtURL = strings.TrimSuffix(dtURL, "/")
	if err := validateURL(dtURL); err != nil {
		return nil, err
	}

	tokenClient := NewTokenAuthClient(token)
	oauthClient := NewOAuthClient(context.TODO(), oauthCredentials)

	classicURL, err := GetDynatraceClassicURL(oauthClient, dtURL)
	if err != nil {
		log.Error("Unable to determine Dynatrace classic environment URL: %v", err)
		return nil, err
	}

	d := &DynatraceClient{
		serverVersion:         version.Version{},
		environmentURL:        dtURL,
		environmentURLClassic: classicURL,
		client:                oauthClient,
		clientClassic:         tokenClient,
		retrySettings:         rest.DefaultRetrySettings,
		settingsSchemaAPIPath: settingsSchemaAPIPathPlatform,
		settingsObjectAPIPath: settingsObjectAPIPathPlatform,
	}

	for _, o := range opts {
		if o != nil {
			o(d)
		}
	}
	return d, nil
}

// NewClassicClient creates a new dynatrace client to be used for classic environments
func NewClassicClient(dtURL string, token string, opts ...func(dynatraceClient *DynatraceClient)) (*DynatraceClient, error) {
	dtURL = strings.TrimSuffix(dtURL, "/")
	if err := validateURL(dtURL); err != nil {
		return nil, err
	}

	tokenClient := NewTokenAuthClient(token)

	d := &DynatraceClient{
		serverVersion:         version.Version{},
		environmentURL:        dtURL,
		environmentURLClassic: dtURL,
		client:                tokenClient,
		clientClassic:         tokenClient,
		retrySettings:         rest.DefaultRetrySettings,
		settingsSchemaAPIPath: settingsSchemaAPIPathClassic,
		settingsObjectAPIPath: settingsObjectAPIPathClassic,
	}

	for _, o := range opts {
		if o != nil {
			o(d)
		}
	}
	return d, nil
}

func validateURL(dtURL string) error {
	parsedUrl, err := url.ParseRequestURI(dtURL)
	if err != nil {
		return fmt.Errorf("environment url %q was not valid: %w", dtURL, err)
	}

	if parsedUrl.Host == "" {
		return fmt.Errorf("no host specified in the url %q", dtURL)
	}

	if parsedUrl.Scheme != "https" {
		log.Warn("You are using an insecure connection (%s). Consider switching to HTTPS.", parsedUrl.Scheme)
	}
	return nil
}

func isNewDynatraceTokenFormat(token string) bool {
	return strings.HasPrefix(token, "dt0c01.") && strings.Count(token, ".") == 2
}

func (d *DynatraceClient) ListConfigs(api api.API) (values []Value, err error) {

	fullUrl := api.CreateURL(d.environmentURLClassic)
	values, err = getExistingValuesFromEndpoint(d.clientClassic, api, fullUrl, d.retrySettings)
	return values, err
}

func (d *DynatraceClient) ReadConfigById(api api.API, id string) (json []byte, err error) {
	return d.ReadConfigByIdSubId(api, id, "")
}

func (d *DynatraceClient) ReadConfigByIdSubId(api api.API, id string, subId string) (json []byte, err error) {
	var dtUrl string
	isSingleConfigurationApi := api.SingleConfiguration

	if isSingleConfigurationApi {
		dtUrl = api.CreateURL(d.environmentURLClassic)
	} else if api.URLSuffix != "" {
		dtUrl = api.CreateURL(d.environmentURLClassic) + "/" + url.PathEscape(id) + "/" + api.URLSuffix
		if subId != "" {
			dtUrl = dtUrl + "/" + subId
		}
	} else {
		dtUrl = api.CreateURL(d.environmentURLClassic) + "/" + url.PathEscape(id)
	}

	if (api.URLQueryParams) != "" {
		dtUrl += "?" + api.URLQueryParams
	}

	response, err := rest.Get(d.clientClassic, dtUrl)

	if err != nil {
		return nil, err
	}

	if !success(response) {
		return nil, fmt.Errorf("failed to get existing config for api %v (HTTP %v)!\n    Response was: %v", api.ID, response.StatusCode, string(response.Body))
	}

	return response.Body, nil
}

// SchemaListResponse is the response type returned by the ListSchemas operation
type SchemaListResponse struct {
	Items      SchemaList `json:"items"`
	TotalCount int        `json:"totalCount"`
}
type SchemaList []struct {
	SchemaId string `json:"schemaId"`
}

func (d *DynatraceClient) ListSchemas() (SchemaList, error) {
	u, err := url.Parse(d.environmentURL + d.settingsSchemaAPIPath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse url: %w", err)
	}

	// getting all schemas does not have pagination
	resp, err := rest.Get(d.client, u.String())
	if err != nil {
		return nil, fmt.Errorf("failed to GET schemas: %w", err)
	}

	if !success(resp) {
		return nil, fmt.Errorf("request failed with HTTP (%d).\n\tResponse content: %s", resp.StatusCode, string(resp.Body))
	}

	var result SchemaListResponse
	err = json.Unmarshal(resp.Body, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if result.TotalCount != len(result.Items) {
		log.Warn("Total count of settings 2.0 schemas (=%d) does not match with count of actually downloaded settings 2.0 schemas (=%d)", result.TotalCount, len(result.Items))
	}

	return result.Items, nil
}

func (d *DynatraceClient) ListSettingsFlat(schemaId string, opts ListSettingsOptions) ([]string, error) {
	log.Debug("Downloading all settings -flat-dump- for schema %s", schemaId)

	resultStrings := make([]string, 0)

	addToResultStrings := func(body []byte) (int, int, error) {
		var parsedRaw SettingsResponseRaw

		if err1 := json.Unmarshal(body, &parsedRaw); err1 != nil {
			return 0, len(resultStrings), fmt.Errorf("failed to unmarshal response: %w", err1)
		}

		contentList := make([]string, len(parsedRaw.Settings))

		for idx, settingMap := range parsedRaw.Settings {
			toSaveData := make(map[string]interface{}, 2)
			toSaveData[rules.DownloadedKey] = settingMap

			rawJson, err := json.Marshal(toSaveData)
			if err != nil {
				return 0, len(resultStrings), err
			}

			contentList[idx] = string(rawJson)
		}

		resultStrings = append(resultStrings, contentList...)

		return len(parsedRaw.Settings), len(resultStrings), nil
	}

	params := genSettingsParams(opts, schemaId)
	_, err := d.listPaginated(d.settingsObjectAPIPath, params, schemaId, addToResultStrings)

	if err != nil {
		return nil, err
	}

	return resultStrings, nil
}

func genSettingsParams(opts ListSettingsOptions, schemaId string) url.Values {
	listSettingsFields := defaultListSettingsFields
	if opts.DiscardValue {
		listSettingsFields = reducedListSettingsFields
	}
	params := url.Values{
		"schemaIds": []string{schemaId},
		"pageSize":  []string{defaultPageSize},
		"fields":    []string{listSettingsFields},
	}
	return params
}

type EntitiesTypeListResponse struct {
	Types []EntitiesType `json:"types"`
}

type EntitiesType struct {
	EntitiesTypeId    string                   `json:"type"`
	ToRelationships   []map[string]interface{} `json:"toRelationships"`
	FromRelationships []map[string]interface{} `json:"fromRelationships"`
	Properties        []map[string]interface{} `json:"properties"`
}

func (e EntitiesType) String() string {
	return e.EntitiesTypeId
}

func (d *DynatraceClient) ListEntitiesTypes() ([]EntitiesType, error) {

	params := url.Values{
		"pageSize": []string{defaultPageSize},
	}

	result := make([]EntitiesType, 0)

	addToResult := func(body []byte) (int, int, error) {
		var parsed EntitiesTypeListResponse

		if err1 := json.Unmarshal(body, &parsed); err1 != nil {
			return 0, len(result), fmt.Errorf("failed to unmarshal response: %w", err1)
		}

		result = append(result, parsed.Types...)

		return len(parsed.Types), len(result), nil
	}

	_, err := d.listPaginated(pathEntitiesTypes, params, "EntityTypeList", addToResult)

	if err != nil {
		return nil, err
	}

	return result, nil
}

type EntityListResponseRaw struct {
	Entities []json.RawMessage `json:"entities"`
}

type EntitiesList struct {
	From     string
	To       string
	Entities []string
}

func genTimeframeUnixMilliString(duration time.Duration) string {
	return strconv.FormatInt(time.Now().Add(duration).UnixMilli(), 10)
}

func (d *DynatraceClient) ListEntities(entitiesType EntitiesType, timeFromMinutes int, timeToMinutes int) (EntitiesList, error) {

	entityType := entitiesType.EntitiesTypeId
	log.Debug("Downloading all entities for entities Type %s", entityType)

	entityList := EntitiesList{
		From:     "",
		To:       "",
		Entities: make([]string, 0),
	}

	addToResult := func(body []byte) (int, int, error) {
		var parsedRaw EntityListResponseRaw

		if err1 := json.Unmarshal(body, &parsedRaw); err1 != nil {
			return 0, len(entityList.Entities), fmt.Errorf("failed to unmarshal response: %w", err1)
		}

		entitiesContentList := make([]string, len(parsedRaw.Entities))

		for idx, str := range parsedRaw.Entities {
			entitiesContentList[idx] = string(str)
		}

		entityList.Entities = append(entityList.Entities, entitiesContentList...)

		return len(parsedRaw.Entities), len(entityList.Entities), nil
	}

	runExtraction := true
	var ignoreProperties []string

	for runExtraction {
		params, from, to := genListEntitiesParams(entityType, entitiesType, timeFromMinutes, timeToMinutes, ignoreProperties)
		entityList.From = from
		entityList.To = to
		resp, err := d.listPaginated(pathEntitiesObjects, params, entityType, addToResult)

		runExtraction, ignoreProperties, err = handleListEntitiesError(entityType, resp, runExtraction, ignoreProperties, err)

		if err != nil {
			return EntitiesList{}, err
		}
	}

	return entityList, nil
}

func (d *DynatraceClient) listPaginated(urlPath string, params url.Values, logLabel string,
	addToResult func(body []byte) (int, int, error)) (rest.Response, error) {

	var resp rest.Response
	startTime := time.Now()
	receivedCount := 0
	totalReceivedCount := 0

	u, err := buildUrl(d.environmentURL, urlPath, params)
	if err != nil {
		return resp, RespError{
			Err:        err,
			StatusCode: 0,
		}
	}

	resp, receivedCount, totalReceivedCount, _, err = d.runAndProcessResponse(false, u, addToResult, receivedCount, totalReceivedCount, urlPath)
	if err != nil {
		return resp, RespError{
			Err:        err,
			StatusCode: resp.StatusCode,
		}
	}

	callCount := 1
	lastLogTime := time.Now()
	expectedTotalCount := resp.TotalCount
	nextPageKey := resp.NextPageKey
	emptyResponseRetryCount := 0

	for {

		if nextPageKey != "" {
			logLongRunningExtractionProgress(&lastLogTime, startTime, callCount, resp, logLabel)

			u = rest.AddNextPageQueryParams(u, nextPageKey)

			var isLastAvailablePage bool
			resp, receivedCount, totalReceivedCount, isLastAvailablePage, err = d.runAndProcessResponse(true, u, addToResult, receivedCount, totalReceivedCount, urlPath)
			if err != nil {
				return resp, RespError{
					Err:        err,
					StatusCode: resp.StatusCode,
				}
			}
			if isLastAvailablePage {
				break
			}

			retry := false
			retry, emptyResponseRetryCount, err = isRetryOnEmptyResponse(receivedCount, emptyResponseRetryCount, resp)
			if err != nil {
				return resp, RespError{
					Err:        err,
					StatusCode: resp.StatusCode,
				}
			}

			if retry {
				continue
			} else {
				validateWrongCountExtracted(resp, totalReceivedCount, expectedTotalCount, urlPath, logLabel, nextPageKey, params)

				nextPageKey = resp.NextPageKey
				callCount++
				emptyResponseRetryCount = 0
			}

		} else {

			break
		}
	}

	return resp, nil

}

const emptyResponseRetryMax = 10

func isRetryOnEmptyResponse(receivedCount int, emptyResponseRetryCount int, resp rest.Response) (bool, int, error) {
	if receivedCount == 0 {
		if emptyResponseRetryCount < emptyResponseRetryMax {
			emptyResponseRetryCount++
			throttle.ThrottleCallAfterError(emptyResponseRetryCount, "Received empty array response, retrying with same nextPageKey (HTTP: %d) ", resp.StatusCode)
			return true, emptyResponseRetryCount, nil
		} else {
			return false, emptyResponseRetryCount, fmt.Errorf("received too many empty responses (=%d)", emptyResponseRetryCount)
		}
	}

	return false, emptyResponseRetryCount, nil
}

func (d *DynatraceClient) runAndProcessResponse(isNextCall bool, u *url.URL,
	addToResult func(body []byte) (int, int, error),
	receivedCount int, totalReceivedCount int, urlPath string) (rest.Response, int, int, bool, error) {
	isLastAvailablePage := false

	resp, err := rest.GetWithRetry(d.client, u.String(), d.retrySettings.Normal)
	isLastAvailablePage, err = validateRespErrors(isNextCall, err, resp, urlPath)
	if err != nil || isLastAvailablePage {
		return resp, receivedCount, totalReceivedCount, isLastAvailablePage, err
	}

	receivedCount, totalReceivedCount, err = addToResult(resp.Body)

	return resp, receivedCount, totalReceivedCount, isLastAvailablePage, err
}

func buildUrl(environmentUrl, urlPath string, params url.Values) (*url.URL, error) {
	u, err := url.Parse(environmentUrl + urlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL '%s': %w", environmentUrl+urlPath, err)
	}

	u.RawQuery = params.Encode()

	return u, nil
}

func validateRespErrors(isNextCall bool, err error, resp rest.Response, urlPath string) (bool, error) {
	if err != nil {
		return false, err
	}
	isLastAvailablePage := false
	if success(resp) {
		return false, nil

	} else if isNextCall {
		if resp.StatusCode == http.StatusBadRequest {
			isLastAvailablePage = true
			log.Warn("Failed to get additional data from paginated API %s - pages may have been removed during request.\n    Response was: %s", urlPath, string(resp.Body))
			return isLastAvailablePage, nil
		} else {
			return isLastAvailablePage, fmt.Errorf("failed to get further data from paginated API %s (HTTP %d)!\n    Response was: %s", urlPath, resp.StatusCode, string(resp.Body))
		}
	} else {
		return isLastAvailablePage, fmt.Errorf("failed to get data from paginated API %s (HTTP %d)!\n    Response was: %s", urlPath, resp.StatusCode, string(resp.Body))
	}

}

func validateWrongCountExtracted(resp rest.Response, totalReceivedCount int, expectedTotalCount int, urlPath string, logLabel string, nextPageKey string, params url.Values) {
	if resp.NextPageKey == "" && totalReceivedCount != expectedTotalCount {
		log.Warn("Total count of items from api: %v for: %s does not match with count of actually downloaded items. Expected: %d Got: %d, last next page key received: %s \n   params: %v", urlPath, logLabel, expectedTotalCount, totalReceivedCount, nextPageKey, params)
	}
}

func logLongRunningExtractionProgress(lastLogTime *time.Time, startTime time.Time, callCount int, resp rest.Response, logLabel string) {
	if time.Since(*lastLogTime).Minutes() >= 1 {
		*lastLogTime = time.Now()
		itemsMessageCount := ""
		ETAMessage := ""
		runningMinutes := time.Since(startTime).Minutes()
		callPerMinuteCount := float64(callCount) / runningMinutes
		if resp.PageSize > 0 && resp.TotalCount > 0 {
			processedCount := callCount * resp.PageSize
			leftCount := resp.TotalCount - processedCount
			ETAMinutes := float64(leftCount) / (callPerMinuteCount * float64(resp.PageSize))
			itemsMessageCount = fmt.Sprintf(", processed %d of %d at %d items/call and", processedCount, resp.TotalCount, resp.PageSize)
			ETAMessage = fmt.Sprintf("ETA: %.1f minutes", ETAMinutes)
		}

		log.Debug("Running extration of: %s for %.1f minutes%s %.1f call/minute. %s", logLabel, runningMinutes, itemsMessageCount, callPerMinuteCount, ETAMessage)
	}
}
