import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useHandlePostSpecific } from '../backend/useHandlePost';
import MigrateButton from './MigrateButton';
import { useProgress } from '../progress/ProgressHook';

export default function MigrateButtonControlled({ entityFilter, handleChange, label, confirm, disabled = false, descLabel = undefined }) {


    const { setLoading, progressComponent } = useProgress()

    const handlePost = useHandlePostSpecific(entityFilter, handleChange, MIGRATE_SETTINGS_2_0, setLoading)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm}
            disabled={disabled} progressComponent={progressComponent} descLabel={descLabel} />
    );
}
