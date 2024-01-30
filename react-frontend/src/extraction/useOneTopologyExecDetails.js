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
import { ONE_TOPOLOGY_CHECK, backendGet } from '../backend/backend';
import { Box, Typography } from '@mui/material';

export function useOneTopologyExecDetails() {
    const [oneTopologyExecDetails, setOneTopologyExecDetails] = React.useState(null)

    React.useEffect(() => {
        backendGet(ONE_TOPOLOGY_CHECK, null,
            promise =>
                promise
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        setOneTopologyExecDetails(data)
                    })
        )

    }, [])

    return React.useMemo(() => {

        let isOneTopologyError = false
        let oneTopologyErrorComponent = []

        if (oneTopologyExecDetails) {
            // pass
        } else {
            return { isOneTopologyError, oneTopologyErrorComponent }
        }

        if (oneTopologyExecDetails && "is_darwin" in oneTopologyExecDetails && oneTopologyExecDetails["is_darwin"] === true) {
            if (oneTopologyExecDetails && "is_one_topology_runnable" in oneTopologyExecDetails && oneTopologyExecDetails['is_one_topology_runnable'] === true) {
                // pass
            } else {
                isOneTopologyError = true
                oneTopologyErrorComponent.push(
                    <React.Fragment>
                        <Typography sx={{ mt: 6 }} variant="h5" color="error.main" align='center'>OneTopology needs to be allowed.</Typography>
                        <Typography sx={{ mt: 6 }} variant="h5" color="error.main">
                            Open a Terminal and run this command:
                        </Typography>
                        <Box
                            sx={{
                                mt: 0.5,
                                overflowX: 'auto',
                            }}
                        >
                            <Typography component="pre" display="block" style={{ wordWrap: "break-word" }}>
                                {oneTopologyExecDetails["absolute_one_topology_exec_path_local"]}
                            </Typography>
                        </Box>


                        <Typography variant="h5" color="error.main">
                            Click OK
                            <br /> Go to System Settings &gt; Privacy & Security &gt; Security where it should be listed.
                            <br /> Click on Allow Anyway next to OneTopology
                            <br /> Run the above command again
                            <br /> Click on Open
                            <br /> Refresh this page
                        </Typography>
                    </React.Fragment >
                )
            }
        }

        return { isOneTopologyError, oneTopologyErrorComponent }
    }, [oneTopologyExecDetails])

}
