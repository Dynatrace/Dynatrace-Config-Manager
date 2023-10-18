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
