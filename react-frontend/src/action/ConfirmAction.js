import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';


export default function ConfirmAction({ open, handleClose, label, descLabel, tenantLabel, handlePost }) {

    const handlePostAndClose = React.useMemo(() => {
        return () => {
            handlePost()
            handleClose()
        }
    }, [handlePost,handleClose])

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
                    {descLabel}
                </DialogContentText>
                <DialogContentText id="alert-dialog-description">
                    {tenantLabel}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handlePostAndClose} autoFocus>
                    Proceed
                </Button>
            </DialogActions>
        </Dialog>
    )
}