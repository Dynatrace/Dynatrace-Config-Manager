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
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenant, useTenantKey, useTenantList } from '../context/TenantListContext';
import { Box, Button } from '@mui/material';

const tenantTypeLabel = {
    [TENANT_KEY_TYPE_MAIN]: "Source",
    [TENANT_KEY_TYPE_TARGET]: TENANT_KEY_TYPE_TARGET,

}


export default function TenantSelector({ tenantKeyType = TENANT_KEY_TYPE_MAIN }) {
    const { tenantKey, setTenantKey } = useTenantKey(tenantKeyType)
    const { tenant } = useTenant(tenantKey)
    const { tenantList } = useTenantList()

    const handleChangeTenantKey = React.useMemo(() => {
        return (event) => {
            setTenantKey(event.target.value);
        }
    }, [setTenantKey])

    const tenantItems = React.useMemo(() => {
        const tenantItemList = []
        tenantList.forEach((tenant, index) => {
            tenantItemList.push(
                genTenantItem(tenant, tenantKeyType)
            )
        })
        return tenantItemList
    }, [tenantList, tenantKeyType])

    const selector = React.useMemo(() => {
        return (

            <Select
                labelId="tenant-select-labell"
                id="tenant-select"
                value={tenantKey}
                label={tenantTypeLabel[tenantKeyType] + " Tenant"}
                onChange={handleChangeTenantKey}
            >
                {tenantItems}
            </Select>
        )
    }, [tenantKey, tenantItems, handleChangeTenantKey, tenantKeyType])

    const linkToTenantUI = React.useMemo(() => {
        if (tenant && tenant.url && tenant.url !== "") {
            return (
                <Box>
                    <Button href={tenant ? tenant.url : ""} target="_blank" rel=" noopener noreferrer">
                        Go To Tenant UI
                    </Button>
                </Box >
            )
        } else {
            return null
        }
    }, [tenant, tenant.url])

    return (
        <React.Fragment>
            <FormControl fullWidth>
                <InputLabel id="tenant-select-label">{tenantTypeLabel[tenantKeyType] + " Tenant"}</InputLabel>
                {selector}
            </FormControl>
            {linkToTenantUI}
        </React.Fragment>
    )
}

const genTenantItem = (tenant, tenantKeyType) => {
    return (
        <MenuItem value={tenant.key} key={"menuItem" + tenant.key}>{genTenantLabel(tenant, tenantKeyType)}</MenuItem>
    )
}

export const genTenantLabel = (tenant, tenantKeyType) => {

    if(tenant){
        ;
    } else {
        return ""
    }

    let label = tenant.label
    if (!label || label === "") {
        label = "New Tenant"
    }
    let url = tenant.url

    if (url && tenant.url !== "") {
        url = " ( " + url + " ) "
    } else {
        url = ""
    }
    label = "[" + tenantTypeLabel[tenantKeyType] + "] " + tenant.key + ": " + label + url

    return label
}