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
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import { useConfirmAction } from '../migrate/ConfirmHook';
import ConfirmAction from '../action/ConfirmAction';
import { genTenantLabel } from '../credentials/TenantSelector';
import { DONE, ERROR, LOADING, useProgress } from '../progress/ProgressHook';
import { useHandleExtract } from './ExtractionHooks';

export default function ExtractButton({ api, label,
    descLabel = "This action will OVERWRITE your last extraction, if any.",
    tenantKeyType = TENANT_KEY_TYPE_MAIN, extraSearchParams = {} }) {

    const { tenantKey } = useTenantKey(tenantKeyType)
    const { tenant: tenantTarget } = useTenant(tenantKey)
    const { progress, setProgress, progressComponent } = useProgress()

    const tenantLabel = React.useMemo(() => {
        return genTenantLabel({ ...tenantTarget, 'key': tenantKey }, "Target")
    }, [tenantTarget, tenantKey])

    const { open, handleClickOpen, handleClose } = useConfirmAction()

    const handleExtract = useHandleExtract(tenantKey, extraSearchParams, setProgress, api)

    const button = React.useMemo(() => {

        const props = { fontSize: 'large' }
        let buttonIcon = null
        let buttonColor = "primary"

        if (progress === DONE) {
            buttonColor = "success"
            buttonIcon = (<CheckIcon {...props} />)
        } else if (progress === LOADING) {
            buttonIcon = progressComponent
        } else if (progress === ERROR) {
            buttonColor = "error"
            buttonIcon = (<ClearIcon {...props} />)
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
        }


        return (
            <React.Fragment>
                <IconButton onClick={handleClickOpen} color={buttonColor}>
                    {buttonIcon}
                    <Typography>{label}</Typography>
                </IconButton>
            </React.Fragment>
        )
    }, [label, handleClickOpen, progressComponent, progress])

    return (
        <Box sx={{ my: 1 }}>
            {button}
            <ConfirmAction open={open} handleClose={handleClose} label={label}
                descLabel={descLabel} tenantLabel={tenantLabel} handlePost={handleExtract} />
        </Box>
    );
}