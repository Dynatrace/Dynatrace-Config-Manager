import { Box, TextField, Tooltip } from '@mui/material';
import * as React from 'react';
import { useSettingState } from '../context/SettingContext';

export default function Setting() {

    const { resultBlockSize, setResultBlockSize } = useSettingState()

    const handleChangeResultBlockSize = (event) => {
        setResultBlockSize(event.target.value)
    }

    return (
        <Box sx={{ my: 1 }}>
            <Tooltip title="Number of auto-expanded levels beyond search results (for faster browsing)." placement="top-end">
                <TextField
                    label="Result Tree auto-expand block size"
                    type="number"
                    value={resultBlockSize}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    onChange={handleChangeResultBlockSize}
                />

            </Tooltip>
        </Box>
    );
}


