import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { backendPost, TEST_CONNECTION } from '../backend/backend';
import { useProgress } from '../progress/ProgressHook';
import { useTenant } from '../context/TenantListContext';

const label = "Test Connection"

export default function TestConnectionButton({ tenantKey }) {

    const [testMessage, setTestMessage] = React.useState("")
    const [testColor, setTestColor] = React.useState(undefined)
    const { setLoading, progressComponent } = useProgress()
    const { tenant: { url, APIKey, disableSystemProxies, proxyURL } } = useTenant(tenantKey)

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

    React.useEffect(() => {
        if (url !== "" && APIKey !== "") {
            runTestConnection()
        } else {
            setTestMessage("URL and Token required")
            setTestColor("error.light")

        }
    }, [runTestConnection, url, APIKey, disableSystemProxies, proxyURL])


    return (
        <Box sx={{ my: 1 }}>
            {progressComponent}
            <Typography sx={{ mt: 1.7 }} color={testColor}>{testMessage}</Typography>
        </Box>
    );
}


/*

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
*/