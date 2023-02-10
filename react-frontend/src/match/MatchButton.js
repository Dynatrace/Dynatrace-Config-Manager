import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Typography } from '@mui/material';
import { useHandlePostCurrent } from '../backend/useHandlePost';
import { useProgress } from '../progress/ProgressHook';

export default function MatchButton({ handleChange, api, label, confirm = false }) {

    const { setLoading, progressComponent } = useProgress()
    const { handlePost } = useHandlePostCurrent(handleChange, api, setLoading)

    const button = React.useMemo(() => {

        const props = { fontSize: 'large' }
        let buttonIcon = null

        if (progressComponent) {
            buttonIcon = progressComponent
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
        }

        return (
            <IconButton onClick={handlePost} color='primary'>
                {buttonIcon}
                <Typography sx={{ ml: 1 }}>{label}</Typography>
            </IconButton>
        )
    }, [label, handlePost, progressComponent])

    return (
        <Box sx={{ my: 1 }}>
            {button}
        </Box>
    );
}
