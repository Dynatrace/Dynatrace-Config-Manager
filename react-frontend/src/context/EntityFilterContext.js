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

import dayjs from 'dayjs';
import * as React from 'react';
import { backendGet, backendPost, ENTITY_FILTER } from '../backend/backend';

export const EntityFilterListContextState = React.createContext();
export const EntityFilterListContextDispatch = React.createContext();

const attributes = {
    'label': {},
    'dateRangeChecked': { 'default': false },
    'startTimestamp': { 'default': dayjs().valueOf() },
    'endTimestamp': { 'default': dayjs().valueOf() },
    'forcedMatchChecked': { 'default': false },
    'forcedMatchEntityChecked': { 'default': false },
    'forcedMatchMain': {},
    'forcedMatchTarget': {},
    'forcedMatchEntityIdChecked': { 'default': false },
    'forcedMatchEntityIdMain': {},
    'forcedMatchEntityIdTarget': {},
    'forcedMatchSchemaIdChecked': { 'default': false },
    'forcedMatchSchemaId': {},
    'forcedMatchKeyIdChecked': { 'default': false },
    'forcedMatchKeyId': {},
    'forcedKeepActionChecked': { 'default': false },
    'forcedKeepAddChecked': { 'default': true },
    'forcedKeepDeleteChecked': { 'default': true },
    'forcedKeepUpdateChecked': { 'default': true },
    'forcedKeepIdenticalChecked': { 'default': true },
    'forcedKeepPreemptiveChecked': { 'default': true },
    'useEnvironmentCache': { 'default': false },
    'applyMigrationChecked': { 'default': false },
    'preemptiveConfigCopy': { 'default': false },
}

export function getDefaultEntityFilter() {
    let entityFilter = {}
    for (const key of Object.keys(attributes)) {
        entityFilter[key] = getDefaultValue(key)
    }
    return { ...entityFilter }
}

function getDefaultValue(key) {
    if (key in attributes
        && 'default' in attributes[key]) {
        return attributes[key]['default']
    }
    return ""
}

export function useLoadEntityFilterList() {
    const [isEntityFilterListLoaded, setEntityFilterListLoaded] = React.useState(false);
    const contextDispatch = useContextDispatch()

    const setEntityFilterList = React.useMemo(() => {
        return (data) => {
            const action = { type: "setEntityFilterList", value: data }
            contextDispatch(action)
        }
    }, [contextDispatch])

    const loadEntityFilterList = React.useMemo(() => {
        return () => {
            backendGet(ENTITY_FILTER, null,
                promise =>
                    promise
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            if (Object.keys(data).length >= 1) {
                                if ('entityFilters' in data) {
                                    for (const entityFilter of Object.values(data['entityFilters'])) {
                                        for (const key of Object.keys(attributes)) {
                                            if (key in entityFilter) {
                                                ;
                                            } else {
                                                entityFilter[key] = getDefaultValue(key)
                                            }
                                        }
                                    }
                                }
                            } else {
                                data = initState()
                            }
                            setEntityFilterList(data)
                            setEntityFilterListLoaded(true)
                        })
            )
        }
    }, [setEntityFilterList])

    React.useMemo(() => {
        if (!isEntityFilterListLoaded) {
            loadEntityFilterList()
        }
    }, [isEntityFilterListLoaded, loadEntityFilterList])

    return { isEntityFilterListLoaded }
}

function postContext(context) {

    backendPost(ENTITY_FILTER, context, null,
        promise =>
            promise
                .then(() => { })
    )
}

function reducer(state, action) {
    let newState = state
    switch (action.type) {
        case 'setEntityFilterList':
            newState = action.value
            break
        case 'updateEntityFilterKey':
            newState = { ...state }
            newState['entityFilterKey'] = action.value
            break
        case 'updateEntityFilter':
            newState = { ...state }
            newState['entityFilters'][action.key] = { ...state['entityFilters'][action.key] }
            newState['entityFilters'][action.key] = action.entityFilter
            break
        case 'updateEntityFilterProperty':
            newState = { ...state }
            newState['entityFilters'][action.key] = { ...state['entityFilters'][action.key] }
            newState['entityFilters'][action.key][action.property] = action.value
            break
        default:
            throw new Error();
    }
    postContext(newState)
    return newState
}

function initState() {
    let entityFilter = getDefaultEntityFilter()
    entityFilter.label = "Example"
    return { "entityFilterKey": "0", "entityFilters": { 0: entityFilter } }
}

export function useEntityFilterListContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, {})

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(EntityFilterListContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(EntityFilterListContextState)
    return contextState
}

export function useEntityFilterKey() {
    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    const entityFilterKey = contextState['entityFilterKey']

    const setEntityFilterKey = (entityFilterKey) => {
        const action = { type: "updateEntityFilterKey", value: entityFilterKey }
        contextDispatch(action)
    }

    return { entityFilterKey, setEntityFilterKey }
}

export function useEntityFilterList() {
    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    const entityFilterList = []

    let maxId = 0

    if ("entityFilters" in contextState) {
        Object.entries(contextState["entityFilters"]).forEach(([key, entityFilter]) => {
            entityFilterList.push({ key, ...entityFilter })
            if (key > maxId) {
                maxId = Number(key)
            }
        });
    }

    const addEntityFilter = () => {
        const newEntityFilterId = maxId + 1
        const action = { type: "updateEntityFilter", key: newEntityFilterId, entityFilter: getDefaultEntityFilter() }
        contextDispatch(action)
        return newEntityFilterId
    }

    return { entityFilterList, addEntityFilter }
}

export function useCurrentEntityFilter() {
    const { entityFilterKey } = useEntityFilterKey()
    return useEntityFilter(entityFilterKey)
}

export function useEntityFilter(key) {

    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    if (key) {

        let returnValues = {}

        const entityFilter = contextState["entityFilters"][key]

        returnValues['entityFilter'] = entityFilter

        const setEntityFilterProperty = (property, value) => {
            const action = { type: "updateEntityFilterProperty", key, property, value }
            contextDispatch(action)
        }

        for (const key of Object.keys(attributes)) {
            const functionName = 'setEntityFilter' + key[0].toUpperCase() + key.substring(1)
            returnValues[functionName] = (value) => {
                setEntityFilterProperty(key, value)
            }
        }

        return returnValues
    }
    return {}
}