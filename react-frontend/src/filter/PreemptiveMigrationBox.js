import { Box, Checkbox, FormControlLabel } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function PreemptiveMigrationBox() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterPreemptiveConfigCopy } = useEntityFilter(entityFilterKey)

    const preemptiveConfigCopyComponents = React.useMemo(() => {

        const handleChangPreemptiveConfigCopy = (event) => {
            setEntityFilterPreemptiveConfigCopy(event.target.checked)
        }

            return (
                <FormControlLabel control={<Checkbox checked={entityFilter.preemptiveConfigCopy}
                    onChange={handleChangPreemptiveConfigCopy} />} label={"Preemptive Configuration Copy (Configurations of entities that are missing in the Target Environment)"} />
            )
    }, [entityFilter, setEntityFilterPreemptiveConfigCopy])

    return (
        <Box sx={{ ml: 1 }}>
            {preemptiveConfigCopyComponents}
        </Box>
    )
}
