import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useHandlePostSpecific } from '../backend/useHandlePost';
import { useConfirmMigrate } from './ConfirmHook';
import MigrateButton from './MigrateButton';

export default function MigrateButtonControlled({ entityFilter, handleChange, label, confirm, disabled=false }) {

    const { open, handleClickOpen, handleClose } = useConfirmMigrate()

    const handlePost = useHandlePostSpecific(entityFilter, handleChange, MIGRATE_SETTINGS_2_0, handleClose)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} open={open} handleClickOpen={handleClickOpen} handleClose={handleClose} disabled={disabled} />
    );
}
