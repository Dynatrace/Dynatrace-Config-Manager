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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey, useTenantList } from '../context/TenantListContext';

export default function CopyTenantButton({ tenantKeyType = TENANT_KEY_TYPE_MAIN }) {

    const { addTenant } = useTenantList()
    const { tenantKey, setTenantKey } = useTenantKey(tenantKeyType)
    const { tenant } = useTenant(tenantKey)

    const handleCopyTenant = () => {
        const newLabel = "Copy of: " + tenant.label
        const tenantData = {...tenant, label: newLabel}
        const newTenantId = addTenant(tenantData)
        setTenantKey(newTenantId)
    }

    return (
        <React.Fragment>
            <IconButton onClick={handleCopyTenant}>
                <ContentCopyIcon />
                <Typography>Duplicate Tenant Credentials (not data)</Typography>
            </IconButton>
        </React.Fragment>
    );
}
