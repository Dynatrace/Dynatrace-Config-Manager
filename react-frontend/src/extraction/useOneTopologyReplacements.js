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
import { ONE_TOPOLOGY_REPLACEMENTS_CHECK, backendGet } from '../backend/backend';
import { Box, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';

export default function OneTopologyReplacements() {
    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const [oneTopologyReplacementsCheck, setOneTopologyReplacementsCheck] = React.useState(null)

    React.useEffect(() => {
        const searchParams = { 'tenant_key_main': tenantKeyMain, 'tenant_key_target': tenantKeyTarget }
        backendGet(ONE_TOPOLOGY_REPLACEMENTS_CHECK, searchParams,
            promise =>
                promise
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        setOneTopologyReplacementsCheck(data)
                    })
        )

    }, [])

    return (
        <React.Fragment>
            <Box sx={{ my: 2, ml: 1 }}>
                {oneTopologyReplacementsCheck ?
                    (
                        <React.Fragment>
                            <Typography color="primary.main">Controlled Replacements: </Typography>
                            <Typography sx={{ ml: 2 }}>Place as many csv mapping files in the specified directories</Typography>
                            <Typography sx={{ ml: 3 }}>csv files should not contain headers</Typography>
                            <Typography sx={{ mt: 2, ml: 2 }}><b>Dashboard Owners: </b> {oneTopologyReplacementsCheck["dashboards_path"]}</Typography>
                        </React.Fragment>
                    )
                    : null}
            </Box>
        </React.Fragment >
    )

}
