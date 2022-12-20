import { Box, Checkbox, FormControlLabel } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ApplyMigrationBox() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterApplyMigrationChecked } = useEntityFilter(entityFilterKey)

    const applyMigrationComponents = React.useMemo(() => {

        const handleChangApplyMigrationChecked = (event) => {
            setEntityFilterApplyMigrationChecked(event.target.checked)
        }

            return (
                <FormControlLabel control={<Checkbox checked={entityFilter.applyMigrationChecked}
                    onChange={handleChangApplyMigrationChecked} />} label={"Apply Migration"} />
            )
    }, [entityFilter, setEntityFilterApplyMigrationChecked])

    return (
        <Box sx={{ ml: 1 }}>
            {applyMigrationComponents}
        </Box>
    )
}
