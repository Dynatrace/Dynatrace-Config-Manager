import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useHandlePostCurrent } from '../backend/useHandlePost';
import MigrateButton from './MigrateButton';

export default function MigrateButtonUncontrolled({ handleChange, label, progressComponent = null, confirm = false }) {

    const { handlePost } = useHandlePostCurrent(handleChange, MIGRATE_SETTINGS_2_0)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} progressComponent={progressComponent} />
    )
}

