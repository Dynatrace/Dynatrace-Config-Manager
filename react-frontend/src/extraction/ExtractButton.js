import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import { Box, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { backendPost } from '../backend/backend';
import { useConfirmAction } from '../migrate/ConfirmHook';
import ConfirmAction from '../action/ConfirmAction';
import { genTenantLabel } from '../credentials/TenantSelector';
import { useProgress } from '../progress/ProgressHook';

export default function ExtractButton({ handleChange, api, label,
    descLabel = "This action will OVERWRITE your last extraction, if any.",
    tenantType = TENANT_KEY_TYPE_MAIN, extraSearchParams = {} }) {

    const { tenantKey } = useTenantKey(tenantType)
    const { tenant: tenantTarget } = useTenant(tenantKey)
    const { setLoading, progressComponent } = useProgress()

    const tenantLabel = React.useMemo(() => {
        return genTenantLabel({ ...tenantTarget, 'key': tenantKey }, "Target")
    }, [tenantTarget, tenantKey])

    const { open, handleClickOpen, handleClose } = useConfirmAction()

    const handleExtract = () => {
        const searchParams = { 'tenant_key': tenantKey, 'use_cache': false, ...extraSearchParams }
        handleChange(null)

        setLoading(true)
        backendPost(api, null, searchParams,
            promise =>
                promise
                    .then(response => {
                        setLoading(false)
                        return response.json()
                    })
                    .then(data => {
                        handleChange(data)
                    })
        )
    }

    const button = React.useMemo(() => {

        const props = { fontSize: 'large' }
        let buttonIcon = null

        if (progressComponent) {
            buttonIcon = progressComponent
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
        }

        return (
            <IconButton onClick={handleClickOpen} color='primary'>
                {buttonIcon}
                <Typography>{label}</Typography>
            </IconButton>
        )
    }, [label, handleClickOpen, progressComponent])

    return (
        <Box sx={{ my: 1 }}>
            {button}
            <ConfirmAction open={open} handleClose={handleClose} label={label}
                descLabel={descLabel} tenantLabel={tenantLabel} handlePost={handleExtract} />
        </Box>
    );
}
