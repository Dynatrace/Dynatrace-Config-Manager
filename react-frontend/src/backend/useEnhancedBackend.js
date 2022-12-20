import { useMemo } from "react"
import { useEntityFilter, useEntityFilterKey } from "../context/EntityFilterContext"
import { backendDelete, backendGet, backendPost, MATCH_ENTITIES_V2, MIGRATE_SETTINGS_2_0 } from "./backend"

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

export function useEnhancedBackendFunctions(completeSearchParams) {

    const enhancedBackendFunctions = useMemo(() => {

        const functions = {
            "backendGet": (api_method, searchParams, thenFunction) => {
                const completedSearchParams = completeSearchParams(api_method, searchParams)
                return backendGet(api_method, completedSearchParams, thenFunction)
            },
            "backendPost": (api_method, payload, searchParams, thenFunction) => {
                const completedSearchParams = completeSearchParams(api_method, searchParams)
                return backendPost(api_method, payload, completedSearchParams, thenFunction)

            },
            "backendDelete": (api_method, payload, searchParams, thenFunction) => {
                const completedSearchParams = completeSearchParams(api_method, searchParams)
                return backendDelete(api_method, payload, completedSearchParams, thenFunction)

            },
        }

        return functions

    }, [completeSearchParams])

    return enhancedBackendFunctions

}

function useCompleteSearchParams(entityFilter, setEntityFilterApplyMigrationChecked, setEntityFilterUseEnvironmentCache) {

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
                    console.log(entityFilter)
                    forcedKeepAction['Add'] = entityFilter.forcedKeepAddChecked
                    forcedKeepAction['Delete'] = entityFilter.forcedKeepDeleteChecked
                    forcedKeepAction['Update'] = entityFilter.forcedKeepUpdateChecked
                    forcedKeepAction['Identical'] = entityFilter.forcedKeepIdenticalChecked
                    console.log(entityFilter.forcedKeepIdenticalChecked)
                    completedSearchParams['forced_keep_action_only'] = JSON.stringify(forcedKeepAction)
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

            }
            return completedSearchParams

        }

        return completeSearchParamsFunction
    }, [entityFilter, setEntityFilterApplyMigrationChecked, setEntityFilterUseEnvironmentCache])

    return completeSearchParams

}