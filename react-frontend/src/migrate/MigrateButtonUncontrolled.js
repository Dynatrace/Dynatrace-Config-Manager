import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useHandlePostCurrent } from '../backend/useHandlePost';
import MigrateButton from './MigrateButton';

export default function MigrateButtonUncontrolled({ handleChange, label, progressComponent = null, confirm = false, runOnce = false, api = MIGRATE_SETTINGS_2_0 }) {

    const { handlePost } = useHandlePostCurrent(handleChange, api)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} progressComponent={progressComponent} runOnce={runOnce} />
    )
}

