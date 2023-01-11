import * as React from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey, useTenantList } from '../context/TenantListContext';

export default function CopyTenantButton({ tenantType = TENANT_KEY_TYPE_MAIN }) {

    const { addTenant } = useTenantList()
    const { tenantKey, setTenantKey } = useTenantKey(tenantType)
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
