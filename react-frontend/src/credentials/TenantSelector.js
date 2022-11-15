import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey, useTenantList } from '../context/TenantListContext';
import { Box, Button } from '@mui/material';

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
                label={tenantKeyType + " Tenant"}
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
                <InputLabel id="tenant-select-label">{tenantKeyType + " Tenant"}</InputLabel>
                {selector}
            </FormControl>
            {linkToTenantUI}
        </React.Fragment>
    )
}

const genTenantItem = (tenant, tenantKeyType) => {
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
    label = "[" + tenantKeyType + "] " + tenant.key + ": " + label + url
    return (
        <MenuItem value={tenant.key} key={"menuItem" + tenant.key}>{label}</MenuItem>
    )
}