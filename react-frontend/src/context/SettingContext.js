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
import { backendGet, backendPost, GLOBAL_SETTINGS } from '../backend/backend';

export const SettingContextState = React.createContext();
export const SettingContextDispatch = React.createContext();

export function useLoadSetting() {
    const contextDispatch = useContextDispatch()
    const [isSettingLoaded, setSettingLoaded] = React.useState(false);

    const setSetting = (data) => {
        const action = { type: "setSetting", value: data }
        contextDispatch(action)
    }
    const loadSetting = () => {

        backendGet(GLOBAL_SETTINGS, null,
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
                        setSetting(state)
                        setSettingLoaded(true)
                    })
        )
    }

    React.useMemo(() => {
        if (!isSettingLoaded) {
            loadSetting()
        }
    }, [isSettingLoaded])

    return { isSettingLoaded }
}

function postContext(context) {

    backendPost(GLOBAL_SETTINGS, context, null,
        promise =>
            promise
                .then(() => { })
    )
}

function reducer(state, action) {
    let newState = state
    switch (action.type) {
        case 'setSetting':
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
    return { resultBlockSize: 1 }
}

export function useSettingContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, initState())

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(SettingContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(SettingContextState)
    return contextState
}

export function useSettingStateValue() {
    const contextState = useContextState()

    const resultBlockSize = contextState['resultBlockSize']

    return { resultBlockSize }
}

export function useSettingState() {
    const { resultBlockSize } = useSettingStateValue()
    const contextDispatch = useContextDispatch()

    const setProperty = (property, value) => {
        const action = { type: "updateProperty", property, value }
        contextDispatch(action)
    }

    const setResultBlockSize = (value) => {
        setProperty("resultBlockSize", value)
    }


    return { resultBlockSize, setResultBlockSize }
}