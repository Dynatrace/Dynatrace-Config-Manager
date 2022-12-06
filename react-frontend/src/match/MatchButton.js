import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Typography } from '@mui/material';
import { useHandlePostCurrent } from '../backend/useHandlePost';

export default function MatchButton({ handleChange, api, label, confirm = false }) {

    const handlePost = useHandlePostCurrent(handleChange, api)

    const button = React.useMemo(() => {

        return (
            <IconButton onClick={handlePost} color='primary'>
                <PlayCircleOutlineIcon fontSize='large'/>
                <Typography sx={{ ml: 1 }}>{label}</Typography>
            </IconButton>
        )
    }, [confirm, label, handlePost])

    return (
        <Box sx={{ my: 1 }}>
            {button}
        </Box>
    );
}
