import * as React from 'react';
import { useHandlePostTerraform } from '../backend/useHandlePost';
import MigrateButton from '../migrate/MigrateButton';

export default function TerraformButton({ terraformParams, handleChange, getActionId, label, confirm, terraformAPI, disabled = false }) {

    const handlePost = useHandlePostTerraform(terraformParams, handleChange, terraformAPI, getActionId)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} disabled={disabled} />
    );
}
