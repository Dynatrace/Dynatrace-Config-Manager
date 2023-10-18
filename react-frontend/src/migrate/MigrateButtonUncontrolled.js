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
import { useHandlePostCurrent } from '../backend/useHandlePost';
import MigrateButton from './MigrateButton';

export default function MigrateButtonUncontrolled({ handleChange, label, progressComponent = null, confirm = false, runOnce = false, api = MIGRATE_SETTINGS_2_0 }) {

    const { handlePost } = useHandlePostCurrent(handleChange, api)

    return (
        <MigrateButton label={label} handlePost={handlePost} confirm={confirm} progressComponent={progressComponent} runOnce={runOnce} />
    )
}

