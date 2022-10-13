import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import { Box, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenantKey } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { backendPost } from '../backend/backend';
import { useExecutionOptionsStateValue } from '../context/ExecutionContext';

export default function ExtractButton({ handleChange, api, label, tenantType = TENANT_KEY_TYPE_MAIN }) {

    const { tenantKey } = useTenantKey(tenantType)
    const { useCache } = useExecutionOptionsStateValue()

    const handleExtract = () => {
        const searchParams = { 'tenant_key': tenantKey, 'use_cache': useCache }

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

    return (
        <Box sx={{ my: 1 }}>
            <IconButton onClick={handleExtract} color='primary'>
                <PlayCircleOutlineIcon fontSize='large' />
                <Typography>{label}</Typography>
            </IconButton>
        </Box>
    );
}
