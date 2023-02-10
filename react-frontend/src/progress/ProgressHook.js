import * as React from 'react'
import _ from 'lodash';
import { Box, CircularProgress } from '@mui/material';

export const useProgress = () => {

    const { loading, setLoading } = useProgressState()
    const progressComponent = useProgressIcon(loading)

    return { setLoading, progressComponent }
}

export const useProgressState = () => {

    const [loading, setLoading] = React.useState(false)

    return { loading, setLoading }
}

export const useProgressIcon = (loading) => {

    const progressComponent = React.useMemo(() => {
        if (loading) {
            return (

                <Box sx={{ my: 2 }}>
                    <CircularProgress size={30} />
                </Box>
            )
        }
        return null

    }, [loading])

    return progressComponent

}