import * as React from 'react';
import { EXTRACT_ENTITY_V2 } from '../backend/backend';
import ExtractButton from './ExtractButton';
import ExtractedTable from './ExtractedTable';

export default function ExtractConfigs({tenantType}) {

    const [extractedData, setExtractedData] = React.useState({});

    return (
        <React.Fragment>
            <ExtractButton handleChange={setExtractedData} api={EXTRACT_ENTITY_V2} label="Extract Entities V2" tenantType={tenantType}/>
            <ExtractedTable data={extractedData}/>
        </React.Fragment>
    );
}
