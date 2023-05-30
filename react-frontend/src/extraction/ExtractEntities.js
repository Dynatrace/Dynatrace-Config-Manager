import * as React from 'react';
import { EXTRACT_ENTITY_V2 } from '../backend/backend';
import ExtractButton from './ExtractButton';

export default function ExtractEntities({ tenantType }) {

    return (
        <React.Fragment>
            <ExtractButton handleChange={() => {}} api={EXTRACT_ENTITY_V2}
                label="Extract Entities V2 (Monaco cli)"
                tenantType={tenantType} />
        </React.Fragment>
    );
}
