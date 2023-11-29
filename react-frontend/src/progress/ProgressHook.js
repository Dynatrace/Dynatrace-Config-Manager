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

import * as React from 'react'
import { Box, CircularProgress } from '@mui/material';

export const NOT_STARTED = "NOT STARTED"
export const LOADING = "LOADING"
export const ERROR = "ERROR"
export const DONE = "DONE"

export const useProgress = (setSubProgress = () => { }) => {

    const { progress, setProgress } = useProgressState()
    const progressComponent = useProgressIcon(progress === LOADING)

    React.useEffect(() => {
        setSubProgress(progress)
    }, [progress, setSubProgress])

    return { progress, setProgress, progressComponent }
}

export const useProgressState = () => {

    const [progress, setProgress] = React.useState(NOT_STARTED)

    return { progress, setProgress }
}

export const useProgressIcon = (loading) => {

    const progressComponent = React.useMemo(() => {
        if (loading) {
            return (

                <Box sx={{ ml: 0.25, mr: 0.75 }}>
                    <CircularProgress size={27} />
                </Box>
            )
        }
        return null

    }, [loading])

    return progressComponent

}