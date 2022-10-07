import { FormControl, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function EntityFilterNameInput() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterLabel } = useEntityFilter(entityFilterKey)


    const handleChangeLabel = (event) => {
        setEntityFilterLabel(event.target.value)
    }

    return (
        <Paper sx = {{mt: 1}}>
            <FormControl fullWidth>
                <TextField id="entity-filter-label-text-field" variant="standard"
                    label="Entity Filter Label" value={entityFilter.label} onChange={handleChangeLabel} />
            </FormControl>
        </Paper>
    )
}