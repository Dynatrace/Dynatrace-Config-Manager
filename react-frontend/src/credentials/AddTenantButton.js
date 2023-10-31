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
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenantKey, useTenantList } from '../context/TenantListContext';

export default function AddTenantButton({tenantKeyType=TENANT_KEY_TYPE_MAIN}) {

    const { addTenant } = useTenantList()
    const { setTenantKey } = useTenantKey(tenantKeyType)
    
    const handleAddTenant = () => {
        const newTenantId = addTenant()
        setTenantKey(newTenantId)
    }

    return (
        <React.Fragment>
            <IconButton onClick={handleAddTenant}>
                <AddIcon />
                <Typography>New Tenant</Typography>
            </IconButton>
        </React.Fragment>
    );
}
