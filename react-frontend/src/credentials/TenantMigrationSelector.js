import * as React from 'react';
import TenantSelector from './TenantSelector';
import { Grid } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET } from '../context/TenantListContext';

export default function TenantMigrationSelector() {

    return (
        <React.Fragment>
            <Grid container>
                <Grid item xs={6}>
                    <TenantSelector tenantKeyType={TENANT_KEY_TYPE_MAIN} />
                </Grid>
                <Grid item xs={6}>
                    <TenantSelector tenantKeyType={TENANT_KEY_TYPE_TARGET} />
                </Grid>
            </Grid>
        </React.Fragment>
    )
}
