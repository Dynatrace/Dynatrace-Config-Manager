import { Checkbox, FormControl, FormControlLabel, Grid, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ApplyMigrationBox() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterApplyMigrationChecked } = useEntityFilter(entityFilterKey)

    const handleChangApplyMigrationChecked = (event) => {
        setEntityFilterApplyMigrationChecked(event.target.checked)
    }

    const applyMigrationComponents = React.useMemo(() => {
        if (entityFilter.forcedMatchChecked && entityFilter.forcedMatchMain && entityFilter.forcedMatchTarget) {
            return (
                <FormControlLabel control={<Checkbox checked={entityFilter.applyMigrationChecked}
                onChange={handleChangApplyMigrationChecked} />} label={"Apply Migration (Testing, only Forced Matches)"} />
            )
        } else {
            return null
        }
    }, [entityFilter.applyMigrationChecked, entityFilter.forcedMatchChecked, , entityFilter.forcedMatchMain, entityFilter.forcedMatchTarget])

    return (
        <Paper sx={{ mt: 1 }}>
            {applyMigrationComponents}
        </Paper>
    )
}