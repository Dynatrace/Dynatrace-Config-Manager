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