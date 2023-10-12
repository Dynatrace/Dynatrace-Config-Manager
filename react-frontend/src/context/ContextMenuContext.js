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

    const resetContextNode = () => {
        setProperty("contextNode", initState()['contextNode'])
    }

    return { contextMenu, contextNode, setContextMenu, setContextNode, resetContextNode }
}