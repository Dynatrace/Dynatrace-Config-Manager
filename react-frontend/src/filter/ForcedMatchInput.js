import { Box, Checkbox, FormControl, FormControlLabel, Grid, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ForcedMatchInput() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterForcedMatchChecked,
        setEntityFilterForcedMatchEntityChecked, setEntityFilterForcedMatchMain, setEntityFilterForcedMatchTarget,
        setEntityFilterForcedMatchSchemaIdChecked, setEntityFilterForcedMatchSchemaId,
        setEntityFilterForcedMatchKeyIdChecked, setEntityFilterForcedMatchKeyId,
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
        const handleChangeForcedMatchSchemaIdChecked = (event) => {
            setEntityFilterForcedMatchSchemaIdChecked(event.target.checked)
        }
        const handleChangeForcedMatchSchemaId = (event) => {
            setEntityFilterForcedMatchSchemaId(event.target.value)
        }
        const handleChangeForcedMatchKeyIdChecked = (event) => {
            setEntityFilterForcedMatchKeyIdChecked(event.target.checked)
        }
        const handleChangeForcedMatchKeyId = (event) => {
            setEntityFilterForcedMatchKeyId(event.target.value)
        }
        const handleChangeUseEnvironmentCache = (event) => {
            setEntityFilterUseEnvironmentCache(event.target.checked)
        }

        if (entityFilter.forcedMatchChecked) {
            return (
                <React.Fragment>
                    <FormControlLabel control={<Checkbox checked={entityFilter.useEnvironmentCache} onChange={handleChangeUseEnvironmentCache} />}
                        label={"Use Cached Global (environment) settings?"} />
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
                    <Grid container>
                        <Grid item xs={2}>
                            <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchSchemaIdChecked} onChange={handleChangeForcedMatchSchemaIdChecked} />}
                                label={"SchemaId:"} />
                        </Grid>
                        <Grid item xs={5}>
                            <FormControl fullWidth>
                                <TextField id="entity-filter-forced-match-main-text-field" variant="standard"
                                    label="Forced Match SchemaId" value={entityFilter.forcedMatchSchemaId} onChange={handleChangeForcedMatchSchemaId}
                                    disabled={!entityFilter.forcedMatchSchemaIdChecked} />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchKeyIdChecked} onChange={handleChangeForcedMatchKeyIdChecked} />}
                                label={"keyId:"} />
                        </Grid>
                        <Grid item xs={5}>
                            <FormControl fullWidth>
                                <TextField id="entity-filter-forced-match-main-text-field" variant="standard"
                                    label="Forced Match KeyId" value={entityFilter.forcedMatchKeyId} onChange={handleChangeForcedMatchKeyId}
                                    disabled={!entityFilter.forcedMatchKeyIdChecked} />
                            </FormControl>
                        </Grid>
                    </Grid>
                </React.Fragment >
            )
        } else {
            return null
        }
    }, [entityFilter])

    return (
        <Box border={1}>
            <Box sx={{ m: 2 }}>
                <Paper sx={{ mt: 1 }}>
                    <Box>
                        <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchChecked}
                            onChange={handleChangForcedMatchChecked} />} label={"Forced Match"} />
                    </Box>
                    <Box>
                        {forcedMatchComponents}
                    </Box>
                </Paper>
            </Box>
        </Box>
    )
}