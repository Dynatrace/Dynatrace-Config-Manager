import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { useEnhancedBackendCurrent, useEnhancedBackendSpecific } from '../backend/useEnhancedBackend';

export function useHandlePostCurrent(handleChange, api, handleCloseDialog = () => { }) {

    const { backendPost } = useEnhancedBackendCurrent()
    const handlePost = useHandlePost(handleChange, api, backendPost, handleCloseDialog)

    return handlePost
}

export function useHandlePostSpecific(entityFilter, handleChange, api, handleCloseDialog = () => { }) {

    const { backendPost } = useEnhancedBackendSpecific(entityFilter)
    const handlePost = useHandlePost(handleChange, api, backendPost, handleCloseDialog)

    return handlePost
}

function useHandlePost(handleChange, api, backendPost, handleCloseDialog = () => { }) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const handlePost = React.useMemo(() => {
        const postFunction = () => {

            handleCloseDialog()

            const searchParams = { 'tenant_key_main': tenantKeyMain, 'tenant_key_target': tenantKeyTarget }
            handleChange(null)
            backendPost(api, null, searchParams,
                promise =>
                    promise
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            handleChange(data)
                        })
            )
        }

        return postFunction
    }, [tenantKeyMain, tenantKeyTarget, handleChange, api, backendPost])


    return handlePost
}
