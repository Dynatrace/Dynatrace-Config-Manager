import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_TARGET, useTenant, useTenantKey } from '../context/TenantListContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import BackupIcon from '@mui/icons-material/Backup';
import { genTenantLabel } from '../credentials/TenantSelector';

export default function MigrateButton({ label, handlePost, open, handleClickOpen, handleClose, confirm = false, disabled = false }) {

    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)
    const { tenant: tenantTarget } = useTenant(tenantKeyTarget)
    const tenantLabel = React.useMemo(() => {
        return genTenantLabel({ ...tenantTarget, 'key': tenantKeyTarget }, "Target")
    }, [tenantTarget])

    const handleClickAction = React.useMemo(() => {
        if (confirm == true) {
            return handleClickOpen
        } else {
            return handlePost
        }
    }, [confirm, handlePost])

    const button = React.useMemo(() => {

        const props = { fontSize: 'large' }
        let buttonIcon = null
        let color = null

        if (confirm === true) {
            buttonIcon = (<BackupIcon {...props} />)
            color = 'success'
        } else {
            buttonIcon = (<PlayCircleOutlineIcon {...props} />)
            color = 'primary'
        }

        return (
            <IconButton onClick={handleClickAction} color={color} disabled={disabled}>
                {buttonIcon}
                <Typography sx={{ ml: 1 }}>{label}</Typography>
            </IconButton>
        )
    }, [confirm, label, handleClickAction])

    const confirmDialog = React.useMemo(() => {

        if (confirm === true) {
            return (
                <Dialog
                    open={open}
                    onClose={handleClose}
                >
                    <DialogTitle id="alert-dialog-title">
                        {label + "?"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            This will send API Requests, updating your tenant's configuration.
                        </DialogContentText>
                        <DialogContentText id="alert-dialog-description">
                            {tenantLabel}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handlePost} autoFocus>
                            Proceed
                        </Button>
                    </DialogActions>
                </Dialog>
            )
        }

        return null


    }, [confirm, handleClose, handlePost])

    return (
        <Box sx={{ my: 1 }}>
            {button}
            {confirmDialog}
        </Box>
    );
}
