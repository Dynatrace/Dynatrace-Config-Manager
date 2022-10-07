import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import { Box, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useEnhancedBackend } from '../backend/useEnhancedBackend';

export default function MatchButton({ handleChange, api, label }) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)
    const { backendGet } = useEnhancedBackend()

    const handleExtract = () => {
        const searchParams = { 'tenant_key_main': tenantKeyMain, 'tenant_key_target': tenantKeyTarget }

        backendGet(api, searchParams,
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

    return (
        <Box sx={{ my: 1 }}>
            <IconButton onClick={handleExtract} color='primary'>
                <PlayCircleOutlineIcon fontSize='large' />
                <Typography>{label}</Typography>
            </IconButton>
        </Box>
    );
}
