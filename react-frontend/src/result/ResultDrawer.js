import * as React from 'react';
import { Global } from '@emotion/react';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { grey } from '@mui/material/colors';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Drawer } from '@mui/material';
import { useContextMenuState } from '../context/ContextMenuContext';
import ResultDrawerDetails from './ResultDrawerDetails';

export const drawerBleeding = 56;

const Root = styled('div')(({ theme }) => ({
    height: '100%',
    backgroundColor:
        theme.palette.mode === 'light' ? grey[0] : theme.palette.background.default,
}));

const StyledBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : grey[0],
}));

const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[900],
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
}));

export default function ResultDrawer({ openDrawer, setOpenDrawer, children }) {

    const { contextNode } = useContextMenuState()

    const drawerEmpty = React.useMemo(() => {
        return (!contextNode)
    }, [contextNode])

    const toggleDrawer = (newOpen) => () => {
        setOpenDrawer(newOpen);
    };

    // This is used only for the example
    const container = undefined;

    const alwaysShowAndScrollable = React.useMemo(() => {
        if (openDrawer) {
            return {}
        } else {
            return { 'position': 'absolute' }
        }

    }, [openDrawer])

    const drawerDetails = React.useMemo(() => {

        return (
            <ResultDrawerDetails />
        )
    }, [])

    return (
        <Root>
            <CssBaseline />
            <Global
                styles={{
                    '.MuiDrawer-root > .MuiPaper-root': {
                        height: `calc(90% - ${drawerBleeding}px)`,
                        overflow: 'visible',
                    },
                }}
            />
            {children}
            <Drawer
                container={container}
                anchor="bottom"
                open={openDrawer}
                onClose={toggleDrawer(false)}
                ModalProps={{
                    keepMounted: true,
                }}
            >
                <StyledBox
                    sx={{
                        ...alwaysShowAndScrollable,
                        top: -drawerBleeding,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        visibility: 'visible',
                        right: 0,
                        left: 0,
                        overflowX: 'auto',
                        overflowY: "auto",
                    }}
                >
                    <Box sx={{ m: 1 }}>
                        <Puller />
                    </Box>
                    <Box sx={{ p: 1, m: 1 }}>
                        <Button onClick={toggleDrawer(!openDrawer)} disabled={drawerEmpty} fullWidth>DETAILS</Button>
                    </Box>
                    <Box>
                        {drawerDetails}
                    </Box>
                </StyledBox>
            </Drawer>
        </Root>
    );
}

