import { Box, Checkbox, FormControl, FormControlLabel, FormLabel, Grid, Paper, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function FilterInput({ label }) {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter,
        setEntityFilterForcedMatchEntityIdChecked, setEntityFilterForcedMatchEntityIdMain, setEntityFilterForcedMatchEntityIdTarget,
        setEntityFilterForcedMatchSchemaIdChecked, setEntityFilterForcedMatchSchemaId,
        setEntityFilterForcedMatchKeyIdChecked, setEntityFilterForcedMatchKeyId,
        setEntityFilterForcedKeepActionChecked, setEntityFilterForcedKeepAddChecked,
        setEntityFilterForcedKeepDeleteChecked, setEntityFilterForcedKeepUpdateChecked,
        setEntityFilterForcedKeepIdenticalChecked, setEntityFilterForcedKeepPreemptiveChecked,
    } = useEntityFilter(entityFilterKey)

    const forcedMatchComponents = React.useMemo(() => {

        const handleChangeForcedMatchEntityIdChecked = (event) => {
            setEntityFilterForcedMatchEntityIdChecked(event.target.checked)
        }
        const handleChangeForcedMatchEntityIdMain = (event) => {
            setEntityFilterForcedMatchEntityIdMain(event.target.value)
        }
        const handleChangeForcedMatchEntityIdTarget = (event) => {
            setEntityFilterForcedMatchEntityIdTarget(event.target.value)
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
        const handleChangeForcedKeepActionChecked = (event) => {
            setEntityFilterForcedKeepActionChecked(event.target.checked)
        }
        const handleChangeForcedKeepAddChecked = (event) => {
            setEntityFilterForcedKeepAddChecked(event.target.checked)
        }
        const handleChangeForcedKeepPreemptiveChecked = (event) => {
            setEntityFilterForcedKeepPreemptiveChecked(event.target.checked)
        }
        const handleChangeForcedKeepDeleteChecked = (event) => {
            setEntityFilterForcedKeepDeleteChecked(event.target.checked)
        }
        const handleChangeForcedKeepUpdateChecked = (event) => {
            setEntityFilterForcedKeepUpdateChecked(event.target.checked)
        }
        const handleChangeForcedKeepIdenticalChecked = (event) => {
            setEntityFilterForcedKeepIdenticalChecked(event.target.checked)
        }

        let forcedKeepActionError = false
        if (entityFilter.forcedKeepActionChecked) {
            if (entityFilter.forcedKeepAddChecked
                || entityFilter.forcedKeepDeleteChecked
                || entityFilter.forcedKeepUpdateChecked
                || entityFilter.forcedKeepIdenticalChecked
                || entityFilter.forcedKeepPreemptiveChecked) {

            } else {
                forcedKeepActionError = true
            }
        }

        return (
            <React.Fragment>
            <Grid container>
                <Grid item xs={2}>
                    <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchEntityIdChecked} onChange={handleChangeForcedMatchEntityIdChecked} />}
                        label={"EntityId:"} />
                </Grid>
                <Grid item xs={5}>
                    <FormControl fullWidth>
                        <TextField id="entity-filter-forced-match-main-text-field" variant="standard"
                            label="Entity Id Filter Main" value={entityFilter.forcedMatchEntityIdMain} onChange={handleChangeForcedMatchEntityIdMain}
                            disabled={!entityFilter.forcedMatchEntityIdChecked} />
                    </FormControl>
                </Grid>
                <Grid item xs={5}>
                    <FormControl fullWidth>
                        <TextField id="entity-filter-forced-match-main-text-field" variant="standard"
                            label="Entity Id Filter Target" value={entityFilter.forcedMatchEntityIdTarget} onChange={handleChangeForcedMatchEntityIdTarget}
                            disabled={!entityFilter.forcedMatchEntityIdChecked} />
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
                                label="SchemaId Filter" value={entityFilter.forcedMatchSchemaId} onChange={handleChangeForcedMatchSchemaId}
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
                                label="KeyId Filter" value={entityFilter.forcedMatchKeyId} onChange={handleChangeForcedMatchKeyId}
                                disabled={!entityFilter.forcedMatchKeyIdChecked} />
                        </FormControl>
                    </Grid>
                </Grid>
                <FormControl fullWidth error = {forcedKeepActionError}>
                    <Grid container>
                        <Grid item xs={3}>
                            <FormControlLabel control={<Checkbox checked={entityFilter.forcedKeepActionChecked} onChange={handleChangeForcedKeepActionChecked} />} />
                            <FormLabel>Keep only checked config actions:</FormLabel>

                        </Grid>
                        <Grid item xs={5}>
                            <Grid container>

                                <Grid item xs={2}>
                                    <FormControlLabel control={<Checkbox id="entity-filter-forcedKeepAddChecked" checked={entityFilter.forcedKeepAddChecked}
                                        onChange={handleChangeForcedKeepAddChecked}
                                        disabled={!entityFilter.forcedKeepActionChecked} />}
                                        label={"Add"} />
                                </Grid>
                                <Grid item xs={2}>
                                    <FormControlLabel control={<Checkbox id="entity-filter-forcedKeepDeleteChecked" checked={entityFilter.forcedKeepDeleteChecked}
                                        onChange={handleChangeForcedKeepDeleteChecked}
                                        disabled={!entityFilter.forcedKeepActionChecked} />}
                                        label={"Delete"} />
                                </Grid>
                                <Grid item xs={2}>
                                    <FormControlLabel control={<Checkbox id="entity-filter-forcedKeepUpdateChecked" checked={entityFilter.forcedKeepUpdateChecked}
                                        onChange={handleChangeForcedKeepUpdateChecked}
                                        disabled={!entityFilter.forcedKeepActionChecked} />}
                                        label={"Update"} />
                                </Grid>
                                <Grid item xs={2}>
                                    <FormControlLabel control={<Checkbox id="entity-filter-forcedKeepIdenticalChecked" checked={entityFilter.forcedKeepIdenticalChecked}
                                        onChange={handleChangeForcedKeepIdenticalChecked}
                                        disabled={!entityFilter.forcedKeepActionChecked} />}
                                        label={"Identical"} />
                                </Grid>
                                <Grid item xs={2}>
                                    <FormControlLabel control={<Checkbox id="entity-filter-forcedKeepPreemptiveChecked" checked={entityFilter.forcedKeepPreemptiveChecked}
                                        onChange={handleChangeForcedKeepPreemptiveChecked}
                                        disabled={!entityFilter.forcedKeepActionChecked} />}
                                        label={"Preemptive"} />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </FormControl>
            </React.Fragment >
        )
    }, [entityFilter, setEntityFilterForcedKeepActionChecked, setEntityFilterForcedKeepAddChecked, setEntityFilterForcedKeepDeleteChecked, setEntityFilterForcedKeepIdenticalChecked, 
        setEntityFilterForcedKeepUpdateChecked, setEntityFilterForcedMatchKeyId, setEntityFilterForcedMatchKeyIdChecked, 
        setEntityFilterForcedMatchSchemaId, setEntityFilterForcedMatchSchemaIdChecked])

    return (
        <Box sx={{ mt: 1 }} border={1}>
            <Box sx={{ mx: 2 }}>
                <Paper>
                    <Typography>{label}:</Typography>
                    <Box>
                        {forcedMatchComponents}
                    </Box>
                </Paper>
            </Box>
        </Box>
    )
}