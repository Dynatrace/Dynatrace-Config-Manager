/*
Copyright 2023 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and 
limitations under the License.
*/

import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Typography } from '@mui/material';
import { useHandlePostCurrent } from '../backend/useHandlePost';
import { ERROR, useProgress } from '../progress/ProgressHook';

export default function MatchButton({ handleChange, api, label, confirm = false }) {

    const { progress, setProgress, progressComponent } = useProgress()
    const { handlePost } = useHandlePostCurrent(handleChange, api, setProgress)

    const button = React.useMemo(() => {

        const props = { fontSize: 'large' }
        let buttonIcon = null

        if (progressComponent) {
            buttonIcon = progressComponent
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
        }

        let buttonColor = "primary"
        if (progress === ERROR) {
            buttonColor = "error"
        }

        return (
            <IconButton onClick={handlePost} color={buttonColor}>
                {buttonIcon}
                <Typography sx={{ ml: 1 }}>{label}</Typography>
            </IconButton>
        )
    }, [label, handlePost, progressComponent, progress])

    return (
        <Box sx={{ my: 1 }}>
            {button}
        </Box>
    );
}
