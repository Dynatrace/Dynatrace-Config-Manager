import * as React from 'react';

export const useConfirmAction = () => {

    const [open, setOpen] = React.useState(false)

    const handleClickOpen = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
    }

    return {open, handleClickOpen, handleClose}
}