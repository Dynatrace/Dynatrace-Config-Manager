/*
Copyright 2023 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and 
limitations under the License.
*/

import config from '../config/config.json'

export const TENANT_LIST = 'tenant_list'
export const EXECUTION_OPTIONS = 'execution_options'
export const GLOBAL_SETTINGS = 'global_settings'
export const ENTITY_FILTER = 'entity_filter'
export const PROXY_GET_ENV = 'proxy_get_env'

export const TEST_CONNECTION = 'test_connection'
export const EXTRACT_CONFIGS = 'extract_configs'
export const EXTRACT_ENTITY_V2 = 'extract_entity_v2'

export const MATCH_ENTITIES_V2 = 'match_entities_v2'

export const MIGRATE_SETTINGS_2_0 = 'migrate_settings_2_0'

export const TERRAFORM_LOAD_UI_PAYLOAD = 'terraform_load_ui_payload'
export const TERRAFORM_PLAN_TARGET = 'terraform_plan_target'
export const TERRAFORM_APPLY_TARGET = 'terraform_apply_target'

export const TERRAFORM_PLAN_ALL = 'terraform_plan_all'
export const TERRAFORM_APPLY_ALL = 'terraform_apply_all'

export const PLAN_ALL_RESOURCE_DIFF = 'terraform_plan_all_resource_diff'

export const TERRAFORM_HISTORY = 'terraform_history_configs'

export const TERRAFORM_LOAD_HISTORY_LIST = 'terraform_load_history_list'
export const TERRAFORM_LOAD_HISTORY_ITEM = 'terraform_load_history_item'
export const TERRAFORM_LOAD_HISTORY_ITEM_LOG = 'terraform_load_history_item_log'
export const TERRAFORM_OPEN_HISTORT_ITEM_LOG_VSCODE = 'terraform_open_history_log_in_vscode'


export function backendGet(api_method, searchParams, thenFunction, catchFunction, showAlert = true) {

    const requestOptions = {
        method: 'GET',
        mode: 'cors',
    }

    return fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction, showAlert)
}

export function backendPost(api_method, payload, searchParams, thenFunction, catchFunction, showAlert = true) {

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
    }

    return fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction, showAlert)
}

export function backendDelete(api_method, payload, searchParams, thenFunction, catchFunction, showAlert = true) {

    const requestOptions = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
    }

    return fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction, showAlert)
}

function fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction, showAlert = true) {
    const fetchPromise = buildFetch(api_method, requestOptions, searchParams)

    if (thenFunction instanceof Function) {
        const validationPromise = validateReturnCodePromise(fetchPromise, api_method, thenFunction, catchFunction)

        return validationPromise
            .catch((error) => {
                if (showAlert) {
                    alert("Error Backend Api: " + api_method + "\n" + error)
                }
                if (catchFunction instanceof Function) {
                    catchFunction(error)
                }
            })
    }

    alert("DEV ERROR: thenFunction not a function", thenFunction, catchFunction)
    console.trace()
}

function validateReturnCodePromise(fetchPromise, api_method, thenFunction, catchFunction) {
    return fetchPromise.then(response => {
        if (response.ok) {
            return thenFunction(Promise.resolve(response))
        } else if (response.status >= 400) {

            const throwHTTPError = (responseTextPromise) => {
                responseTextPromise.then(responseText => {
                    throw new Error("Http Status: " + response.status + "\nBody: " + responseText)
                })
                    .catch((error) => {
                        alert("Error Backend Api: " + api_method + "\n" + error)
                        if (catchFunction instanceof Function) {
                            catchFunction(error)
                        }
                    })

            }

            return throwHTTPError(response.text())
        }
    })
}

function buildFetch(api_method, requestOptions, searchParams) {
    return fetch(getBackendURL(api_method, searchParams), requestOptions)
}

function getBackendURL(api_method, searchParams) {
    let searchParamsString = ""

    if (searchParams) {
        searchParamsString += '?' + new URLSearchParams(searchParams)
    }

    const environment = process.env.REACT_APP_ENVIRONMENT;

    if (environment === "test") {
        return `http://${config.backend_host}/${api_method}${searchParamsString}`
    }
    return `${window.location.origin}/${api_method}${searchParamsString}`
}