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
import IconButton from '@mui/material/IconButton';
import { Box, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_TARGET, useTenant, useTenantKey } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import BackupIcon from '@mui/icons-material/Backup';
import { genTenantLabel } from '../credentials/TenantSelector';
import ConfirmAction from '../action/ConfirmAction';
import { useConfirmAction } from './ConfirmHook';

export default function MigrateButton({ label, handlePost, confirm = false, disabled = false,
    progressComponent = null, runOnce = false,
    descLabel = "Will send API Requests, updating your tenant's configuration." }) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_TARGET)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)
    const { tenant: tenantTarget } = useTenant(tenantKeyTarget)
    const { open, handleClickOpen, handleClose } = useConfirmAction()

    const tenantLabel = React.useMemo(() => {
        return genTenantLabel({ ...tenantTarget, 'key': tenantKeyTarget }, "Target")
    }, [tenantTarget, tenantKeyTarget])

    const handleClickAction = React.useMemo(() => {
        if (confirm === true) {
            return handleClickOpen
        } else {
            return handlePost
        }
    }, [confirm, handlePost, handleClickOpen])

    React.useEffect(() => {
        if (runOnce) {
            handleClickAction()
        }
    }, [tenantKeyMain, tenantKeyTarget])

    const button = React.useMemo(() => {

        const props = { fontSize: 'large' }
        let buttonIcon = null
        let color = null

        if (confirm === true) {
            buttonIcon = (<BackupIcon {...props} />)
            color = 'success'
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
            color = 'primary'
        }

        if (progressComponent) {
            buttonIcon = progressComponent
        }

        return (
            <IconButton onClick={handleClickAction} color={color} disabled={disabled}>
                {buttonIcon}
                <Typography sx={{ ml: 1 }}>{label}</Typography>
            </IconButton>
        )
    }, [confirm, label, handleClickAction, disabled, progressComponent])

    const confirmDialog = React.useMemo(() => {

        if (confirm === true) {

            let descLabelShown = descLabel
            if (descLabelShown === undefined) {
                descLabelShown = "Will send API Requests, updating your tenant's configuration."
            }

            return (
                <ConfirmAction open={open} handleClose={handleClose} label={label}
                    descLabel={descLabelShown} tenantLabel={tenantLabel} handlePost={handlePost} />
            )
        }

        return null


    }, [confirm, handleClose, handlePost, label, open, tenantLabel, descLabel])

    return (
        <Box sx={{ my: 1 }}>
            {button}
            {confirmDialog}
        </Box>
    );
}
