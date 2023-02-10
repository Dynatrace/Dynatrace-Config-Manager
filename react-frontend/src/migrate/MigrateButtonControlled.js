import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useHandlePostSpecific } from '../backend/useHandlePost';
import MigrateButton from './MigrateButton';

export default function MigrateButtonControlled({ entityFilter, handleChange, label, confirm, disabled = false }) {

    const handlePost = useHandlePostSpecific(entityFilter, handleChange, MIGRATE_SETTINGS_2_0)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} disabled={disabled} />
    );
}
