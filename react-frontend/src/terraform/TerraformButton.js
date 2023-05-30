import * as React from 'react';
import { useHandlePostTerraform } from '../backend/useHandlePost';
import MigrateButton from '../migrate/MigrateButton';
import { useProgress } from '../progress/ProgressHook';

export default function TerraformButton({ terraformParams, handleChange, getActionId, label, confirm, terraformAPI, disabled = false }) {

    const { setLoading, progressComponent } = useProgress()
    const handlePost = useHandlePostTerraform(terraformParams, handleChange, terraformAPI, getActionId, setLoading)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} disabled={disabled} progressComponent={progressComponent} />
    );
}
