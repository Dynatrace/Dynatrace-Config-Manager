import * as React from 'react';

export const ResultContextState = React.createContext();
export const ResultContextDispatch = React.createContext();

function reducer(state, action) {
    let newState = state
    switch (action.type) {
        case 'setResultContext':
            newState = action.value
            break
        case 'updateResult':
            newState = { ...state }
            newState['results'][action.key] = action.value
            break
        default:
            throw new Error();
    }
    return newState
}

export function useResultContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, { 'results': {} })

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(ResultContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(ResultContextState)
    return contextState
}

export function useResult(key) {

    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    let result = undefined
    let setResult = undefined

    if (key) {

        result = contextState["results"][key]

        setResult = (value) => {
            const action = { type: "updateResult", key, value }
            contextDispatch(action)
        }

    }

    return { result, setResult }

}