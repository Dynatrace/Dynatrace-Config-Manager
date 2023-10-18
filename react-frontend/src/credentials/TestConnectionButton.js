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
import { useProgress } from '../progress/ProgressHook';
import { useTenant } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const label = "Test Connection"

export default function TestConnectionButton({ tenantKey }) {

    const [testMessage, setTestMessage] = React.useState("")
    const [testColor, setTestColor] = React.useState(undefined)
    const { setLoading, progressComponent } = useProgress()
    //const { tenant: { url, APIKey, disableSystemProxies, proxyURL } } = useTenant(tenantKey)

    const runTestConnection = React.useMemo(() => {

        const api = TEST_CONNECTION

        const handleExtract = () => {
            const searchParams = { 'tenant_key': tenantKey }

            setTestMessage("")
            setTestColor("black")
            setLoading(true)
            backendPost(api, null, searchParams,
                promise =>
                    promise
                        .then(response => {
                            setLoading(false)
                            return response.json()
                        })
                        .then(data => {
                            setTestMessage("Tested Successfully")
                            setTestColor("success.light")
                        }),
                (error) => {
                    setLoading(false)
                    setTestMessage("Failed")
                    setTestColor("error.dark")
                },
                false
            )
        }

        return handleExtract
    }, [setLoading, tenantKey])

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

        const props = { fontSize: 'large' }
        let buttonIcon = null

        if (progressComponent) {
            buttonIcon = progressComponent
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
        }

        return (
            <IconButton onClick={runTestConnection} color='primary'>
                {buttonIcon}
                <Typography>{label}</Typography>
            </IconButton>
        )
    }, [progressComponent, runTestConnection])

    return (
        <Box sx={{ my: 1 }}>
            {button}
            <Typography sx={{ mt: 1.7 }} color={testColor}>{testMessage}</Typography>
        </Box>
    );
}