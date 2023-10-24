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
import { useContextMenuState } from './ContextMenuContext';

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

    const { resetContextNode: resetContextNodeMenu } = useContextMenuState()
    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    let result = null
    let setResult = undefined

    if (key) {

        result = contextState["results"][key]

        setResult = (value, resetMenu = true) => {
            if (resetMenu) {
                resetContextNodeMenu()
            }
            const action = { type: "updateResult", key, value }
            contextDispatch(action)
        }

    }

    return { result, setResult }

}