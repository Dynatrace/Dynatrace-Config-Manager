import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useHandlePostCurrent } from '../backend/useHandlePost';
import { useConfirmMigrate } from './ConfirmHook';
import MigrateButton from './MigrateButton';

export default function MigrateButtonUncontrolled({ handleChange, label, confirm = false }) {

    const {open, handleClickOpen, handleClose} = useConfirmMigrate()

    const handlePost = useHandlePostCurrent(handleChange, MIGRATE_SETTINGS_2_0, handleClose)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} open={open} handleClickOpen={handleClickOpen} handleClose={handleClose}/>
    );
}
