import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { useEnhancedBackendCurrent, useEnhancedBackendSpecific, useEnhancedBackendTerraform } from '../backend/useEnhancedBackend';

export function useHandlePostCurrent(handleChange, api, setLoading=()=>{}) {

    const { backendPost } = useEnhancedBackendCurrent()
    const handlePost = useHandlePost(handleChange, api, backendPost, setLoading)

    return { handlePost }
}

export function useHandlePostSpecific(entityFilter, handleChange, api, setLoading=()=>{}) {

    const { backendPost } = useEnhancedBackendSpecific(entityFilter)
    const handlePost = useHandlePost(handleChange, api, backendPost, setLoading)

    return handlePost
}

export function useHandlePostTerraform(terraformParams, handleChange, api, getActionId) {

    const { backendPost } = useEnhancedBackendTerraform(terraformParams, getActionId)
    const handlePost = useHandlePost(handleChange, api, backendPost)

    return handlePost
}

function useHandlePost(handleChange, api, backendPost, setLoading=()=>{}) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const handlePost = React.useMemo(() => {
        const postFunction = () => {

            const searchParams = { 'tenant_key_main': tenantKeyMain, 'tenant_key_target': tenantKeyTarget }
            setLoading(true)
            handleChange(null)
            backendPost(api, null, searchParams,
                promise =>
                    promise
                        .then(response => {
                            setLoading(false)
                            return response.json()
                        })
                        .then(data => {
                            handleChange(data)
                        })
            )
        }

        return postFunction
    }, [tenantKeyMain, tenantKeyTarget, handleChange, api, backendPost, setLoading])


    return handlePost
}
