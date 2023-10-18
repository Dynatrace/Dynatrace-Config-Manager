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