import * as React from 'react';
import { backendGet, backendPost, EXECUTION_OPTIONS } from '../backend/backend';

export const ExecutionOptionsContextState = React.createContext();
export const ExecutionOptionsContextDispatch = React.createContext();

export function useLoadExecutionOptions() {
    const contextDispatch = useContextDispatch()
    const [isExecutionOptionsLoaded, setExecutionOptionsLoaded] = React.useState(false);

    const setExecutionOptions = (data) => {
        const action = { type: "setExecutionOptions", value: data }
        contextDispatch(action)
    }
    const loadExecutionOptions = () => {

        backendGet(EXECUTION_OPTIONS, null,
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
                        setExecutionOptions(state)
                        setExecutionOptionsLoaded(true)
                    })
        )
    }

    React.useMemo(() => {
        if (!isExecutionOptionsLoaded) {
            loadExecutionOptions()
        }
    }, [isExecutionOptionsLoaded])

    return { isExecutionOptionsLoaded }
}

function postContext(context) {

    backendPost(EXECUTION_OPTIONS, context, null,
        promise =>
            promise
                .then(() => { })
    )
}

function reducer(state, action) {
    let newState = state
    switch (action.type) {
        case 'setExecutionOptions':
            newState = action.value
            break
        case 'updateProperty':
            newState = { ...state }
            newState[action.property] = action.value
            break
        default:
            throw new Error();
    }
    postContext(newState)
    return newState
}

function initState() {
    return { enableDashboards: false, enableOmitDestroy: false }
}

export function useExecutionOptionsContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, initState())

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(ExecutionOptionsContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(ExecutionOptionsContextState)
    return contextState
}

export function useExecutionOptionsStateValue() {
    const contextState = useContextState()

    const enableDashboards = contextState['enableDashboards'] === true
    const enableOmitDestroy = contextState['enableOmitDestroy'] === true

    return { enableDashboards, enableOmitDestroy }
}

export function useExecutionOptionsState() {
    const { enableDashboards, enableOmitDestroy } = useExecutionOptionsStateValue()
    const contextDispatch = useContextDispatch()

    const setProperty = (property, value) => {
        const action = { type: "updateProperty", property, value }
        contextDispatch(action)
    }

    const setEnableDashboards = (value) => {
        setProperty("enableDashboards", value)
    }


    const setEnableOmitDestroy = (value) => {
        setProperty("enableOmitDestroy", value)
    }


    return { enableDashboards, enableOmitDestroy, setEnableDashboards, setEnableOmitDestroy }
}