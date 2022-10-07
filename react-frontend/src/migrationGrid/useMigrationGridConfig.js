import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';

export function useMigrationGridConfig() {
    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const gridConfigList = React.useMemo(() => {

        let gridConfigList = []

        if (tenantKeyMain) {
            gridConfigList.push(TENANT_KEY_TYPE_MAIN)
        }

        if (tenantKeyTarget
            && tenantKeyTarget !== tenantKeyMain) {
            gridConfigList.push(TENANT_KEY_TYPE_TARGET)
        }

        return gridConfigList

    }, [tenantKeyMain, tenantKeyTarget])

    return gridConfigList
}