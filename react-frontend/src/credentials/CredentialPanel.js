import * as React from 'react';
import Box from '@mui/material/Box';import TenantConfig from './TenantConfig';
import AddTenantButton from './AddTenantButton';
import TenantMigrationSelector from './TenantMigrationSelector';
import { Grid } from '@mui/material';
import { useMigrationGridConfig } from '../migrationGrid/useMigrationGridConfig';

export default function CredentialPanel() {
    const gridConfigList = useMigrationGridConfig()

    const tenantGridComponentList = React.useMemo(() => {

        let gridComponentList = []

        for (const keyType of gridConfigList) {

            gridComponentList.push(
                <React.Fragment>
                    <Grid item xs={5}>
                        <AddTenantButton tenantType={keyType} />
                        <TenantConfig tenantType={keyType} />
                    </Grid>
                    <Grid item xs={1} />
                </React.Fragment>
            )
        }
        return gridComponentList
    }, [gridConfigList])

    return (
        <Box sx={{ minWidth: 120 }}>
            <TenantMigrationSelector />
            <Grid container>
                {tenantGridComponentList}
            </Grid>
        </Box>
    );
}
