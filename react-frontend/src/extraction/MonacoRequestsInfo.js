import { Typography } from '@mui/material';
import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from '../context/TenantListContext';
import { DEFAULT_MONACO_CONCURRENT_REQUESTS } from '../credentials/TenantConfig';


export default function MonacoRequestsInfo({ tenantType = TENANT_KEY_TYPE_MAIN }) {

    const { tenantKey } = useTenantKey(tenantType)
    const { tenant } = useTenant(tenantKey)

    return (
        <React.Fragment>
            <Typography>The Monaco extraction will send {tenant.monacoConcurrentRequests?tenant.monacoConcurrentRequests:DEFAULT_MONACO_CONCURRENT_REQUESTS} concurrent requests.</Typography>
            <Typography>If the extraction fails, it could be caused by rate limiting.</Typography>
            <Typography>You can reduce the number of concurrent requests 'per tenant' in the Credentials tab.</Typography>
        </React.Fragment>
    );
}
