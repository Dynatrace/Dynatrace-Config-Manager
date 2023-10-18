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

import { Box, Checkbox, FormControl, FormControlLabel, Grid, Paper, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';

const error_color = 'error.dark'

export default function ForcedMatchInput({ label }) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterForcedMatchChecked,
        setEntityFilterForcedMatchEntityChecked, setEntityFilterForcedMatchMain, setEntityFilterForcedMatchTarget,
        setEntityFilterUseEnvironmentCache } = useEntityFilter(entityFilterKey)

    const handleChangForcedMatchChecked = (event) => {
        setEntityFilterForcedMatchChecked(event.target.checked)
    }

    const forcedMatchComponents = React.useMemo(() => {
        
        const handleChangeForcedMatchEntityChecked = (event) => {
            setEntityFilterForcedMatchEntityChecked(event.target.checked)
        }
        const handleChangeForcedMatchMain = (event) => {
            setEntityFilterForcedMatchMain(event.target.value)
        }
        const handleChangeForcedMatchTarget = (event) => {
            setEntityFilterForcedMatchTarget(event.target.value)
        }
        const handleChangeUseEnvironmentCache = (event) => {
            setEntityFilterUseEnvironmentCache(event.target.checked)
        }

        if (entityFilter.forcedMatchChecked) {

            if (entityFilter.forcedKeepActionChecked) {
                if (entityFilter.forcedKeepAddChecked
                    || entityFilter.forcedKeepDeleteChecked
                    || entityFilter.forcedKeepUpdateChecked
                    || entityFilter.forcedKeepIdenticalChecked
                    || entityFilter.forcedKeepPreemptiveChecked) {

                } else {
                    // show error label
                }
            }

            return (
                <React.Fragment>
                    <Grid container>
                        <Grid item xs={2}>
                            <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchEntityChecked} onChange={handleChangeForcedMatchEntityChecked} />}
                                label={"EntityId:"} />
                        </Grid>
                        <Grid item xs={5}>
                            <FormControl fullWidth>
                                <TextField id="entity-filter-forced-match-main-text-field" variant="standard"
                                    label="Forced Match Main" value={entityFilter.forcedMatchMain} onChange={handleChangeForcedMatchMain}
                                    disabled={!entityFilter.forcedMatchEntityChecked} />
                            </FormControl>
                        </Grid>
                        <Grid item xs={5}>
                            <FormControl fullWidth>
                                <TextField id="entity-filter-forced-match-target-text-field" variant="standard"
                                    label="Forced Match Target" value={entityFilter.forcedMatchTarget} onChange={handleChangeForcedMatchTarget}
                                    disabled={!entityFilter.forcedMatchEntityChecked} />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <FormControlLabel control={<Checkbox checked={entityFilter.useEnvironmentCache} onChange={handleChangeUseEnvironmentCache} />}
                        label={"Use Cached Global (environment) settings?"} />
                </React.Fragment >
            )
        } else {
            return null
        }
    }, [entityFilter, setEntityFilterForcedMatchEntityChecked, setEntityFilterForcedMatchMain, setEntityFilterForcedMatchTarget,
        setEntityFilterUseEnvironmentCache])

    const forcedMatchErrorLabel = React.useMemo(() => {
        if(tenantKeyMain === tenantKeyTarget) {
            return (
                <Typography sx={{ color: error_color }}>Warning: Forced Match will work on the same tenant, but you need to define 2 different tenant credentials (which can be a copy of each other)</Typography>
            )
        } else {
            return null
        }
    }, [tenantKeyMain, tenantKeyTarget])

    return (
        <Box sx={{ mt: 1 }} border={1}>
            <Box sx={{ mx: 2 }}>
                <Paper>
                    <Box>
                        <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchChecked}
                            onChange={handleChangForcedMatchChecked} />} label={label} />
                            {forcedMatchErrorLabel}
                    </Box>
                    <Box>
                        {forcedMatchComponents}
                    </Box>
                </Paper>
            </Box>
        </Box>
    )
}