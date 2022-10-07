import { useMemo } from "react"
import { useEntityFilter, useEntityFilterKey } from "../context/EntityFilterContext"
import { backendDelete, backendGet, backendPost, MATCH_ENTITIES_V2, MIGRATE_CONFIG_V2 } from "./backend"

const entityFilterMap = {
    [MATCH_ENTITIES_V2]: true,
    [MIGRATE_CONFIG_V2]: true,
}

export function useEnhancedBackend() {

    const completeSearchParams = useCompleteSearchParams()

    const enhancedBackendFunctions = useMemo(() => {

        const functions = {
            "backendGet": (api_method, searchParams, thenFunction) => {
                console.log("3")
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

function useCompleteSearchParams() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterApplyMigrationChecked } = useEntityFilter(entityFilterKey)

    const completeSearchParams = useMemo(() => {
        const completeSearchParamsFunction = (api_method, searchParams) => {

            let completedSearchParams = {}

            console.log(searchParams)
            if (searchParams) {
                completedSearchParams = { ...searchParams }
            }

            if (api_method in entityFilterMap
                && entityFilterMap[api_method] === true) {

                if (entityFilter.dateRangeChecked) {
                    completedSearchParams['time_from'] = entityFilter.startTimestamp
                    completedSearchParams['time_to'] = entityFilter.endTimestamp
                }

                if (entityFilter.forcedMatchChecked
                    && entityFilter.forcedMatchMain
                    && entityFilter.forcedMatchTarget) {

                    const forcedMatchMain = entityFilter.forcedMatchMain
                    const forcedMatchTarget = entityFilter.forcedMatchTarget

                    completedSearchParams['active_rules'] = JSON.stringify(['6'])
                    completedSearchParams['context_params'] = JSON.stringify({
                        'provided_id': {
                            [forcedMatchTarget]: forcedMatchMain
                        }
                    })

                    console.log(entityFilter)
                    console.log(entityFilter.applyMigrationChecked)
                    if(entityFilter.applyMigrationChecked) {
                        console.log("@@@")
                        setEntityFilterApplyMigrationChecked(false)
                        completedSearchParams['pre_migration'] = false
                    }
                }

                

            }
            return completedSearchParams

        }

        return completeSearchParamsFunction
    }, [entityFilter.dateRangeChecked, entityFilter.startTimestamp, entityFilter.endTimestamp])

    return completeSearchParams

}


/*



*/