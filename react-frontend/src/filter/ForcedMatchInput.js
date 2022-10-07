import { Checkbox, FormControl, FormControlLabel, Grid, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ForcedMatchInput() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterForcedMatchChecked, setEntityFilterForcedMatchMain, setEntityFilterForcedMatchTarget } = useEntityFilter(entityFilterKey)

    const handleChangForcedMatchChecked = (event) => {
        setEntityFilterForcedMatchChecked(event.target.checked)
    }
    const handleChangeForcedMatchMain = (event) => {
        setEntityFilterForcedMatchMain(event.target.value)
    }
    const handleChangeForcedMatchTarget = (event) => {
        setEntityFilterForcedMatchTarget(event.target.value)
    }

    const forcedMatchComponents = React.useMemo(() => {
        if (entityFilter.forcedMatchChecked) {
            return (
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
            )
        } else {
            return null
        }
    }, [entityFilter.forcedMatchChecked, entityFilter.forcedMatchMain, entityFilter.forcedMatchTarget])

    return (
        <Paper sx={{ mt: 1 }}>
            <FormControlLabel control={<Checkbox checked={entityFilter.forcedMatchChecked}
                onChange={handleChangForcedMatchChecked} />} label={"Forced Match"} />
            {forcedMatchComponents}
        </Paper>
    )
}