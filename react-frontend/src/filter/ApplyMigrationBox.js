import { Checkbox, FormControlLabel, Paper } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ApplyMigrationBox() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterApplyMigrationChecked } = useEntityFilter(entityFilterKey)

    const applyMigrationComponents = React.useMemo(() => {

        const handleChangApplyMigrationChecked = (event) => {
            setEntityFilterApplyMigrationChecked(event.target.checked)
        }

        if (entityFilter.forcedMatchChecked && entityFilter.forcedMatchMain && entityFilter.forcedMatchTarget) {
            return (
                <FormControlLabel control={<Checkbox checked={entityFilter.applyMigrationChecked}
                    onChange={handleChangApplyMigrationChecked} />} label={"Apply Migration (Testing, only Forced Matches)"} />
            )
        } else {
            return null
        }
    }, [entityFilter.applyMigrationChecked, entityFilter.forcedMatchChecked, entityFilter.forcedMatchMain, 
        entityFilter.forcedMatchTarget])

    return (
        <Paper sx={{ mt: 1 }}>
            {applyMigrationComponents}
        </Paper>
    )
}