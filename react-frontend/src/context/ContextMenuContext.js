import * as React from 'react';

export const ContextMenuContextState = React.createContext();
export const ContextMenuContextDispatch = React.createContext();

function reducer(state, action) {
    let newState = state
    switch (action.type) {
        case 'setContextMenu':
            newState = action.value
            break
        case 'updateProperty':
            newState = { ...state }
            newState[action.property] = action.value
            break
        default:
            throw new Error();
    }
    return newState
}

function initState() {
    return { contextMenu: null, contextNode: null }
}

export function useContextMenuContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, initState())

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(ContextMenuContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(ContextMenuContextState)
    return contextState
}

export function useContextMenuStateValue() {
    const contextState = useContextState()

    const { contextMenu, contextNode } = contextState

    return { contextMenu, contextNode }
}

export function useContextMenuState() {
    const { contextMenu, contextNode } = useContextMenuStateValue()
    const contextDispatch = useContextDispatch()

    const setProperty = (property, value) => {
        const action = { type: "updateProperty", property, value }
        contextDispatch(action)
    }

    const setContextMenu = (value) => {
        setProperty("contextMenu", value)
    }

    const setContextNode = (value) => {
        setProperty("contextNode", value)
    }

    return { contextMenu, contextNode, setContextMenu, setContextNode }
}