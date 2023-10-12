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
import { EXTRACT_CONFIGS } from '../backend/backend';
import { TENANT_KEY_TYPE_MAIN } from '../context/TenantListContext';
import ExtractButton from './ExtractButton';

export default function ExtractConfigs({ tenantType = TENANT_KEY_TYPE_MAIN }) {

    return (
        <React.Fragment>
            <ExtractButton handleChange={() => { }} api={EXTRACT_CONFIGS}
                label="Extract Configs (Monaco cli)"
                tenantType={tenantType} />
        </React.Fragment>
    );
}
