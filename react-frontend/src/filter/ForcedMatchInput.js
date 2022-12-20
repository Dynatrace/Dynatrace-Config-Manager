import { Box, Checkbox, FormControl, FormControlLabel, Grid, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ForcedMatchInput({ label }) {

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
                    || entityFilter.forcedKeepIdenticalChecked) {

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

    return (
        <Box sx={{ mt: 1 }} border={1}>
            <Box sx={{ mx: 2 }}>
                <Paper>
                    <Box>
                        <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchChecked}
                            onChange={handleChangForcedMatchChecked} />} label={label} />
                    </Box>
                    <Box>
                        {forcedMatchComponents}
                    </Box>
                </Paper>
            </Box>
        </Box>
    )
}