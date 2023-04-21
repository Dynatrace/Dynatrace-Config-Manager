import * as React from 'react';
import { EXTRACT_CONFIGS } from '../backend/backend';
import { TENANT_KEY_TYPE_MAIN } from '../context/TenantListContext';
import ExtractButton from './ExtractButton';
import ExtractedTable from './ExtractedTable';

export default function ExtractConfigs({tenantType=TENANT_KEY_TYPE_MAIN}) {

    const [extractedData, setExtractedData] = React.useState();

    return (
        <React.Fragment>
            <ExtractButton handleChange={setExtractedData} api={EXTRACT_CONFIGS} 
            label="Extract Config V2 (Monaco cli)"
            tenantType={tenantType}/>
            <ExtractedTable data={extractedData}/>
        </React.Fragment>
    );
}
