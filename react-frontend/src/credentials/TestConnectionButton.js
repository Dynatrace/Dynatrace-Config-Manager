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
import { Box, IconButton, Typography } from '@mui/material';
import { backendPost, TEST_CONNECTION } from '../backend/backend';
import { DONE, ERROR, LOADING, useProgress } from '../progress/ProgressHook';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useTenant } from '../context/TenantListContext';


export default function TestConnectionButton({ tenantKey }) {

    const { progress, setProgress, progressComponent } = useProgress()
    const { tenant: { connectionTested }, setConnectionTested } = useTenant(tenantKey)

    const runTestConnection = React.useMemo(() => {

        const api = TEST_CONNECTION

        const handleExtract = () => {
            const searchParams = { 'tenant_key': tenantKey }

            setConnectionTested(undefined)
            setProgress(LOADING)
            const thenFunction = promise =>
                promise
                    .then(response => {
                        setProgress(DONE)
                        return response.json()
                    })
                    .then(data => {
                        setConnectionTested(true)
                    })

            const catchFunction = (error) => {
                setProgress(ERROR)
                setConnectionTested(false)
            }

            backendPost(api, null, searchParams, thenFunction, catchFunction, false)
        }

        return handleExtract
    }, [setProgress, tenantKey, setConnectionTested])

    /*
    React.useEffect(() => {
        if (url !== "" && APIKey !== "") {
            runTestConnection()
        } else {
            setTestMessage("URL and Token required")
            setTestColor("error.light")

        }
    }, [runTestConnection, url, APIKey, disableSystemProxies, proxyURL])
    */

    const button = React.useMemo(() => {

        const iconProps = { fontSize: 'large' }
        let buttonIcon = null
        let buttonColor = "primary"
        let label = "Test Connection"

        if (connectionTested === true) {
            buttonColor = "success"
            label = "Successfully tested connection"
            buttonIcon = (<CheckIcon {...iconProps} color={buttonColor} />)
        } else if (progress === ERROR) {
            buttonColor = "error"
            label = "Failed to connect"
            buttonIcon = (<ClearIcon {...iconProps} color={buttonColor} />)
        } else if (progressComponent) {
            buttonColor = "primary"
            label = "Testing Connection"
            buttonIcon = progressComponent
        } else {
            buttonColor = "primary"
            buttonIcon = (<PlayCircleOutlineIcon {...iconProps} />)
        }

        return (
            <IconButton onClick={runTestConnection} color={buttonColor}>
                {buttonIcon}
                <Typography>{label}</Typography>
            </IconButton>
        )
    }, [connectionTested, progress, progressComponent, runTestConnection])

    return (
        <Box sx={{ mt: 1 }}>
            {button}
        </Box>
    );
}