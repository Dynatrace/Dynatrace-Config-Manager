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
import Box from '@mui/material/Box';import TenantConfig from './TenantConfig';
import AddTenantButton from './AddTenantButton';
import TenantMigrationSelector from './TenantMigrationSelector';
import { Grid } from '@mui/material';
import { useMigrationGridConfig } from '../migrationGrid/useMigrationGridConfig';
import CopyTenantButton from './CopyTenantButton';

export default function CredentialPanel() {
    const gridConfigList = useMigrationGridConfig()

    const tenantGridComponentList = React.useMemo(() => {

        let gridComponentList = []

        for (const keyType of gridConfigList) {

            gridComponentList.push(
                <React.Fragment key={keyType}>
                    <Grid item xs={5}>
                        <AddTenantButton tenantKeyType={keyType} />
                        <CopyTenantButton tenantKeyType={keyType} />
                        <TenantConfig tenantKeyType={keyType} />
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
