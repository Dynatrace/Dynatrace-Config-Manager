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

import { useMemo } from "react"
import { useEntityFilter, useEntityFilterKey } from "../context/EntityFilterContext"
import { backendDelete, backendGet, backendPost, MATCH_ENTITIES_V2, MIGRATE_SETTINGS_2_0 } from "./backend"
import { useExecutionOptionsStateValue } from "../context/ExecutionContext"

const entityFilterMap = {
    [MATCH_ENTITIES_V2]: true,
    [MIGRATE_SETTINGS_2_0]: true,
}

export function useEnhancedBackendCurrent() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterApplyMigrationChecked, setEntityFilterUseEnvironmentCache } = useEntityFilter(entityFilterKey)

    const completeSearchParams = useCompleteSearchParams(entityFilter, setEntityFilterApplyMigrationChecked, setEntityFilterUseEnvironmentCache)

    const enhancedBackendFunctions = useEnhancedBackendFunctions(completeSearchParams)

    return enhancedBackendFunctions

}

export function useEnhancedBackendSpecific(entityFilter) {

    const completeSearchParams = useCompleteSearchParams(entityFilter, null, null)

    const enhancedBackendFunctions = useEnhancedBackendFunctions(completeSearchParams)

    return enhancedBackendFunctions

}

export function useEnhancedBackendTerraform(terraformParams, getActionId) {

    const completeSearchParams = useCompleteSearchParamsTerraform(getActionId)

    const enhancedBackendFunctions = useEnhancedBackendFunctions(completeSearchParams, terraformParams)

    return enhancedBackendFunctions

}

export function useEnhancedBackendFunctions(completeSearchParams, payloadTerraform) {

    const enhancedBackendFunctions = useMemo(() => {

        const functions = {
            "backendGet": (api_method, searchParams, thenFunction, catchFunction) => {
                const completedSearchParams = completeSearchParams(api_method, searchParams)
                return backendGet(api_method, completedSearchParams, thenFunction, catchFunction)
            },
            "backendPost": (api_method, payload, searchParams, thenFunction, catchFunction, showAlert = true) => {
                const completedSearchParams = completeSearchParams(api_method, searchParams)
                return backendPost(api_method, payloadTerraform, completedSearchParams, thenFunction, catchFunction, showAlert)

            },
            "backendDelete": (api_method, payload, searchParams, thenFunction, catchFunction) => {
                const completedSearchParams = completeSearchParams(api_method, searchParams)
                return backendDelete(api_method, payload, completedSearchParams, thenFunction, catchFunction)

            },
        }

        return functions

    }, [completeSearchParams, payloadTerraform])

    return enhancedBackendFunctions

}

function useCompleteSearchParams(entityFilter, setEntityFilterApplyMigrationChecked, setEntityFilterUseEnvironmentCache) {

    const options = useExecutionOptionsStateValue()

    const completeSearchParams = useMemo(() => {
        const completeSearchParamsFunction = (api_method, searchParams) => {

            let completedSearchParams = {}

            if (searchParams) {
                completedSearchParams = { ...searchParams }
            }

            if (api_method in entityFilterMap
                && entityFilterMap[api_method] === true) {

                if (entityFilter.dateRangeChecked) {
                    completedSearchParams['time_from'] = entityFilter.startTimestamp
                    completedSearchParams['time_to'] = entityFilter.endTimestamp
                }

                if (entityFilter.forcedMatchChecked) {

                    if (entityFilter.forcedMatchEntityChecked === true
                        && entityFilter.forcedMatchMain
                        && entityFilter.forcedMatchMain !== ""
                        && entityFilter.forcedMatchTarget
                        && entityFilter.forcedMatchTarget !== "") {

                        const forcedMatchMain = entityFilter.forcedMatchMain
                        const forcedMatchTarget = entityFilter.forcedMatchTarget

                        completedSearchParams['active_rules'] = JSON.stringify(['6'])
                        completedSearchParams['context_params'] = JSON.stringify({
                            'provided_id': {
                                [forcedMatchTarget]: forcedMatchMain
                            }
                        })

                        completedSearchParams['use_environment_cache'] = entityFilter.useEnvironmentCache
                    }
                }

                if (entityFilter.forcedMatchEntityIdChecked === true) {
                    if (entityFilter.forcedMatchEntityIdMain
                        && entityFilter.forcedMatchEntityIdMain !== '') {
                        completedSearchParams['forced_entity_id_main'] = entityFilter.forcedMatchEntityIdMain
                    }
                    if (entityFilter.forcedMatchEntityIdTarget
                        && entityFilter.forcedMatchEntityIdTarget !== '') {
                        completedSearchParams['forced_entity_id_target'] = entityFilter.forcedMatchEntityIdTarget
                    }
                }

                if (entityFilter.forcedMatchSchemaIdChecked === true
                    && entityFilter.forcedMatchSchemaId) {

                    completedSearchParams['forced_schema_id'] = entityFilter.forcedMatchSchemaId
                }

                if (entityFilter.forcedMatchKeyIdChecked
                    && entityFilter.forcedMatchKeyId) {

                    completedSearchParams['forced_key_id'] = entityFilter.forcedMatchKeyId
                }

                if (entityFilter.forcedKeepActionChecked) {
                    const forcedKeepAction = {}
                    forcedKeepAction['Add'] = entityFilter.forcedKeepAddChecked
                    forcedKeepAction['Delete'] = entityFilter.forcedKeepDeleteChecked
                    forcedKeepAction['Update'] = entityFilter.forcedKeepUpdateChecked
                    forcedKeepAction['Identical'] = entityFilter.forcedKeepIdenticalChecked
                    forcedKeepAction['Preemptive'] = entityFilter.forcedKeepPreemptiveChecked
                    completedSearchParams['forced_keep_action_only'] = JSON.stringify(forcedKeepAction)
                }

                if (entityFilter.preemptiveConfigCopy === true) {
                    completedSearchParams['preemptive_config_copy'] = entityFilter.preemptiveConfigCopy
                }

                if (entityFilter.applyMigrationChecked) {
                    if (setEntityFilterApplyMigrationChecked) {
                        setEntityFilterApplyMigrationChecked(false)
                    }
                    if (setEntityFilterUseEnvironmentCache) {
                        setEntityFilterUseEnvironmentCache(false)
                    }
                    completedSearchParams['pre_migration'] = false
                }

                if (entityFilter.getActionIdFunc) {
                    completedSearchParams['action_id'] = entityFilter.getActionIdFunc()
                }

                const { enableDashboards, enableOmitDestroy, terraformParallelism, enableUltraParallel } = options

                if (enableDashboards === true) {
                    completedSearchParams['enable_dashboards'] = JSON.stringify(enableDashboards)
                }

                if (enableOmitDestroy === true) {
                    completedSearchParams['enable_omit_destroy'] = JSON.stringify(enableOmitDestroy)
                }

                if (terraformParallelism && terraformParallelism !== "" && terraformParallelism > 0) {
                    completedSearchParams['terraform_parallelism'] = terraformParallelism
                }

                if (enableUltraParallel === true) {
                    completedSearchParams['enable_ultra_parallel'] = JSON.stringify(enableUltraParallel)
                }

            }
            return completedSearchParams

        }

        return completeSearchParamsFunction
    }, [entityFilter, setEntityFilterApplyMigrationChecked, setEntityFilterUseEnvironmentCache, options])

    return completeSearchParams

}

function useCompleteSearchParamsTerraform(getActionId) {

    const completeSearchParams = useMemo(() => {
        const completeSearchParamsFunction = (api_method, searchParams) => {

            let completedSearchParams = {}

            if (searchParams) {
                completedSearchParams = { ...searchParams }
            }

            const action_id = getActionId()
            completedSearchParams['action_id'] = action_id

            return completedSearchParams

        }

        return completeSearchParamsFunction
    }, [getActionId])

    return completeSearchParams

}