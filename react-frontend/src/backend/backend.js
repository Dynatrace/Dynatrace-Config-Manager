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


export function backendGet(api_method, searchParams, thenFunction, catchFunction) {

    const requestOptions = {
        method: 'GET',
        mode: 'cors',
    }

    return fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction)
}

export function backendPost(api_method, payload, searchParams, thenFunction, catchFunction) {

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
    }

    return fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction)
}

export function backendDelete(api_method, payload, searchParams, thenFunction, catchFunction) {

    const requestOptions = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
    }

    return fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction)
}

function fetchRunThen(api_method, requestOptions, searchParams, thenFunction, catchFunction) {
    const fetchPromise = buildFetch(api_method, requestOptions, searchParams)

    if (thenFunction instanceof Function) {
        const validationPromise = validateReturnCodePromise(fetchPromise, api_method, thenFunction, catchFunction)

        return validationPromise
            .catch((error) => {
                alert("Error Backend Api: " + api_method + "\n" + error)
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

    return 'http://' + config.backend_host + '/' + api_method + searchParamsString
}