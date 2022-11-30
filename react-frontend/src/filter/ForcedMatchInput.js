import { Box, Checkbox, FormControl, FormControlLabel, Grid, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import ApplyMigrationBox from './ApplyMigrationBox';

export default function ForcedMatchInput() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterForcedMatchChecked, setEntityFilterForcedMatchMain, setEntityFilterForcedMatchTarget, setEntityFilterUseEnvironmentCache } = useEntityFilter(entityFilterKey)

    const handleChangForcedMatchChecked = (event) => {
        setEntityFilterForcedMatchChecked(event.target.checked)
    }

    const forcedMatchComponents = React.useMemo(() => {

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
            return (
                <React.Fragment>
                    <FormControlLabel control={<Checkbox checked={entityFilter.useEnvironmentCache} onChange={handleChangeUseEnvironmentCache} />}
                        label={"Use Cached Global (environment) settings?"} />
                    <Grid container>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <TextField id="entity-filter-forced-match-main-text-field" variant="standard"
                                    label="Forced Match Main" value={entityFilter.forcedMatchMain} onChange={handleChangeForcedMatchMain} />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>

                            <FormControl fullWidth>
                                <TextField id="entity-filter-forced-match-target-text-field" variant="standard"
                                    label="Forced Match Target" value={entityFilter.forcedMatchTarget} onChange={handleChangeForcedMatchTarget} />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <ApplyMigrationBox />
                </React.Fragment>
            )
        } else {
            return null
        }
    }, [entityFilter.forcedMatchChecked, entityFilter.forcedMatchMain, entityFilter.forcedMatchTarget, entityFilter.useEnvironmentCache])

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