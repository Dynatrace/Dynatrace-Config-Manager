import * as React from 'react';
import { EXTRACT_CONFIGS } from '../backend/backend';
import { TENANT_KEY_TYPE_MAIN } from '../context/TenantListContext';
import ExtractButton from './ExtractButton';

export default function ExtractConfigs({ tenantType = TENANT_KEY_TYPE_MAIN }) {

    return (
        <React.Fragment>
            <ExtractButton handleChange={() => { }} api={EXTRACT_CONFIGS}
                label="Extract Config V2 (Monaco cli)"
                tenantType={tenantType} />
        </React.Fragment>
    );
}
