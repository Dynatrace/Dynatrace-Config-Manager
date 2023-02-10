import * as React from 'react';
import { backendGet, backendPost, TENANT_LIST } from '../backend/backend';

export const TENANT_KEY_TYPE_MAIN = "Main"
export const TENANT_KEY_TYPE_TARGET = "Target"

export const TenantListContextState = React.createContext();
export const TenantListContextDispatch = React.createContext();

function getDefaultTenant() {
    const tenant = { label: "", headers:"", APIKey: "", url: "", monacoConcurrentRequests: 10, disableSSLVerification: false, disableSystemProxies: false, notes: "" }
    return { ...tenant }
}

export function useLoadTenantList() {
    const [isTenantListLoaded, setTenantListLoaded] = React.useState(false);
    const contextDispatch = useContextDispatch()

    const setTenantList = React.useMemo(() => {
        return (data) => {
            const action = { type: "setTenantList", value: data }
            contextDispatch(action)
        }
    }, [contextDispatch])

    const loadTenantList = React.useMemo(() => {
        return () => {
            backendGet(TENANT_LIST, null,
                promise =>
                    promise
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            if (Object.keys(data).length >= 1) {
                            } else {
                                data = initState()
                            }
                            setTenantList(data)
                            setTenantListLoaded(true)
                        })
            )
        }
    }, [setTenantList])

    React.useMemo(() => {
        if (!isTenantListLoaded) {
            loadTenantList()
        }
    }, [isTenantListLoaded, loadTenantList])

    return { isTenantListLoaded }
}

function postContext(context) {

    backendPost(TENANT_LIST, context, null,
        promise =>
            promise
                .then(() => { })
    )
}

function reducer(state, action) {
    let newState = state
    switch (action.type) {
        case 'setTenantList':
            newState = action.value
            break
        case 'updateTenantKey':
            newState = { ...state }
            newState['tenantKey'][action.tenantKeyType] = action.value
            break
        case 'updateTenant':
            newState = { ...state }
            newState['tenants'][action.key] = {...state['tenants'][action.key]}
            newState['tenants'][action.key] = action.tenant
            break
        case 'updateTenantProperty':
            newState = { ...state }
            newState['tenants'][action.key] = {...state['tenants'][action.key]}
            newState['tenants'][action.key][action.property] = action.value
            break
        default:
            throw new Error();
    }
    postContext(newState)
    return newState
}

function initState() {
    let tenant = getDefaultTenant()
    tenant.label = "Demo"
    return { "tenantKey": { TENANT_KEY_TYPE_MAIN: "0", TENANT_KEY_TYPE_TARGET: "0" }, "tenants": { 0: tenant } }
}

export function useTenantListContextReducer() {
    const [state, contextDispatch] = React.useReducer(reducer, {}/*initState()*/)

    return [state, contextDispatch]
}

function useContextDispatch() {
    const contextDispatch = React.useContext(TenantListContextDispatch)
    return contextDispatch
}

function useContextState() {
    const contextState = React.useContext(TenantListContextState)
    return contextState
}

export function useTenantKey(tenantKeyType) {
    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    let tenantKey = "0"

    if ('tenantKey' in contextState
        && tenantKeyType in contextState['tenantKey']) {
        tenantKey = contextState['tenantKey'][tenantKeyType]
    }

    const setTenantKey = (tenantKey) => {
        const action = { type: "updateTenantKey", value: tenantKey, tenantKeyType: tenantKeyType }
        contextDispatch(action)
    }

    return { tenantKey, setTenantKey }
}

export function useTenantList() {
    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    const tenantList = []

    let maxId = 0

    if ("tenants" in contextState) {
        Object.entries(contextState["tenants"]).forEach(([key, tenant]) => {
            tenantList.push({ key, label: tenant.label, url: tenant.url })
            if (key > maxId) {
                maxId = Number(key)
            }
        });
    }

    const addTenant = (inputTenantData=null) => {
        const newTenantId = maxId + 1
        let tenantData = undefined
        if(inputTenantData) {
            tenantData = inputTenantData
        } else {
            tenantData = getDefaultTenant()
        }
        const action = { type: "updateTenant", key: newTenantId, tenant: tenantData }
        contextDispatch(action)
        return newTenantId
    }

    return { tenantList, addTenant }
}

export function useCurrentTenant(tenantKeyType) {
    const { tenantKey } = useTenantKey(tenantKeyType)
    return useTenant(tenantKey)
}

export function useTenant(key) {

    const contextState = useContextState()
    const contextDispatch = useContextDispatch()

    if (key) {

        const tenant = contextState["tenants"][key]

        const setTenantProperty = (property, value) => {
            const action = { type: "updateTenantProperty", key, property, value }
            contextDispatch(action)
        }

        const setTenantLabel = (value) => {
            setTenantProperty("label", value)
        }

        const setTenantUrl = (value) => {
            setTenantProperty("url", value)
        }

        const setTenantHeaders = (value) => {
            setTenantProperty("headers", value)
        }

        const setTenantAPIKey = (value) => {
            setTenantProperty("APIKey", value)
        }

        const setTenantMonacoConcurrentRequests = (value) => {
            setTenantProperty("monacoConcurrentRequests", value)
        }

        const setTenantDisableSSLVerification = (value) => {
            setTenantProperty("disableSSLVerification", value)
        }

        const setTenantDisableSystemProxies = (value) => {
            setTenantProperty("disableSystemProxies", value)
        }

        const setTenantNotes = (value) => {
            setTenantProperty("notes", value)
        }

        return { tenant, setTenantLabel, setTenantUrl, setTenantHeaders, setTenantAPIKey, setTenantMonacoConcurrentRequests, setTenantDisableSSLVerification, setTenantDisableSystemProxies, setTenantNotes }
    }
    return {}
}