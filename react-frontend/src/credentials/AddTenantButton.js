import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenantKey, useTenantList } from '../context/TenantListContext';

export default function AddTenantButton({tenantType=TENANT_KEY_TYPE_MAIN}) {

    const { addTenant } = useTenantList()
    const { setTenantKey } = useTenantKey(tenantType)
    
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
