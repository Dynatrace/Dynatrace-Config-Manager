import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useEntityFilterKey, useEntityFilterList } from '../context/EntityFilterContext';

export default function AddEntityFilterButton() {

    const { addEntityFilter } = useEntityFilterList()
    const { setEntityFilterKey } = useEntityFilterKey()
    
    const handleAddEntityFilter = () => {
        const newEntityFilterId = addEntityFilter()
        setEntityFilterKey(newEntityFilterId)
    }

    return (
        <React.Fragment>
            <IconButton onClick={handleAddEntityFilter}>
                <AddIcon />
                <Typography>New EntityFilter</Typography>
            </IconButton>
        </React.Fragment>
    );
}
