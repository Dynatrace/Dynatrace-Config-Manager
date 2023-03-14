import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import { Box, Grid, Typography } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { backendPost, TEST_CONNECTION } from '../backend/backend';
import { useProgress } from '../progress/ProgressHook';

const label = "Test Connection"

export default function TestConnectionButton({ tenantKey }) {

    const [testMessage, setTestMessage] = React.useState("")
    const { setLoading, progressComponent } = useProgress()

    const button = React.useMemo(() => {
        const api = TEST_CONNECTION

        const handleChangeTestMessage = (message) => {
            setTestMessage(message)
        }

        const handleExtract = () => {
            const searchParams = { 'tenant_key': tenantKey }

            handleChangeTestMessage('')
            setLoading(true)
            backendPost(api, null, searchParams,
                promise =>
                    promise
                        .then(response => {
                            console.log("Test")
                            setLoading(false)
                            return response.json()
                        })
                        .then(data => {
                            handleChangeTestMessage("Tested Successfully")
                        }),
                (error) => {
                    setLoading(false)
                    handleChangeTestMessage("Failed")
                }
            )
        }

        const props = { fontSize: 'large' }
        let buttonIcon = null

        if (progressComponent) {
            buttonIcon = progressComponent
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
        }

        return (
            <IconButton onClick={handleExtract} color='primary'>
                {buttonIcon}
                <Typography>{label}</Typography>
            </IconButton>
        )
    }, [progressComponent, setLoading, tenantKey])

    return (
        <Box sx={{ my: 1 }}>
            <Grid container>
                <Grid item xs={4}>
                    {button}
                </Grid>
                <Grid item xs={6}>
                    <Typography sx={{ mt: 1.7 }}>{testMessage}</Typography>
                </Grid>
            </Grid>
        </Box>
    );
}
