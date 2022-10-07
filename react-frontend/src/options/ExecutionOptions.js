import { Box, Button } from '@mui/material';
import * as React from 'react';
import { useExecutionOptionsState } from '../context/ExecutionContext';

export default function ExecutionOptions() {

    const { useCache, setUseCache } = useExecutionOptionsState()

    const handleCacheToggle = () => {
        setUseCache(!useCache)
    }

    const genCacheButtonProps = () => {
        let props = {}
        if (useCache) {
            props = { variant: "contained", color: "success" }
        } else {
            props = { variant: "contained", color: "error" }
        }
        return props
    }

    return (
        <Box sx={{ my: 1 }}>
            <Button onClick={handleCacheToggle} {...genCacheButtonProps()}>Use Cache</Button>
        </Box>
    );
}


