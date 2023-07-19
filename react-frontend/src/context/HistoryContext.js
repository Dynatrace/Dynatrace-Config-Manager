import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { backendGet, backendPost, TERRAFORM_HISTORY } from '../backend/backend';

export const HistoryContextState = React.createContext();
export const HistoryContextDispatch = React.createContext();

export function useLoadHistory() {
    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const contextDispatch = useContextDispatch()
    const [lastMigrationIdLoaded, setLastMigrationIdLoaded] = React.useState("");

    const migrationID = React.useMemo(() => {
        const migrationID = tenantKeyMain + '-' + tenantKeyTarget

        if (lastMigrationIdLoaded !== migrationID) {
            const setHistory = (data) => {
                const action = {
                    type: "setHistoryOnLoad",
                    value: {
                        ...data,
                        keys: { tenantKeyMain, tenantKeyTarget }
                    }
                }
                contextDispatch(action)
            }

            backendGet(TERRAFORM_HISTORY, {
                tenant_key_main: tenantKeyMain,
                tenant_key_target: tenantKeyTarget,
            },
                promise =>
                    promise
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            let state = initState()
                            for (const key of Object.keys(data)) {
                                if (key !== 'undefined') {
                                    state[key] = data[key]
                                }
                            }
                            setHistory(state)
                            setLastMigrationIdLoaded(migrationID)
                        })
            )
        }

        return migrationID
    }, [lastMigrationIdLoaded, tenantKeyMain, tenantKeyTarget, contextDispatch])

    return { isHistoryLoaded: (lastMigrationIdLoaded === migrationID) }
}

function postContext(context) {

    backendPost(TERRAFORM_HISTORY,
        context,
        {
            tenant_key_main: context['keys']['tenantKeyMain'],
            tenant_key_target: context['keys']['tenantKeyTarget'],
        },
        promise =>
            promise
                .then(() => { })
    )
}

function reducer(state, action) {
    let newState = state
    let doPost = false
    switch (action.type) {
        case 'setHistoryOnLoad':
            newState = action.value
            break
        case 'updateProperty':
            newState = { ...state }
            newState[action.property] = action.value
            doPost = true
            break
        default:
            throw new Error();
    }
    if (doPost) {
        postContext(newState)
    }
    return newState
}

function initState() {
    return { lastActionId: "", lastPlanAllActionId: "" }
}

export function useHistoryContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, initState())

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(HistoryContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(HistoryContextState)
    return contextState
}

export function useHistoryStateValue() {
    const contextState = useContextState()

    const lastActionId = contextState['lastActionId']
    const lastPlanAllActionId = contextState['lastPlanAllActionId']

    return { lastActionId, lastPlanAllActionId }
}

export function useHistoryState() {
    const { lastActionId, lastPlanAllActionId } = useHistoryStateValue()
    const contextDispatch = useContextDispatch()

    const setProperty = (property, value) => {
        const action = { type: "updateProperty", property, value }
        contextDispatch(action)
    }

    const setLastActionId = (value) => {
        setProperty("lastActionId", value)
    }

    const setLastPlanAllActionId = (value) => {
        setProperty("lastPlanAllActionId", value)
    }

    return { lastActionId, lastPlanAllActionId, setLastActionId, setLastPlanAllActionId }
}