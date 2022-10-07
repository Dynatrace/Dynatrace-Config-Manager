import { Grid } from '@mui/material';
import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import { useMigrationGridConfig } from '../migrationGrid/useMigrationGridConfig';
import ExecutionOptions from '../options/ExecutionOptions';
import ExtractConfigs from './ExtractConfigs';
import ExtractEntities from './ExtractEntities';

export default function ExtractionPanel() {
    const gridConfigList = useMigrationGridConfig()

    const extractionGridComponentList = React.useMemo(() => {

        let gridComponentList = []

        for (const keyType of gridConfigList) {

            gridComponentList.push(
                <React.Fragment>
                    <Grid item xs={5}>
                        <ExecutionOptions />
                        <ExtractConfigs tenantType={keyType} />
                        <ExtractEntities tenantType={keyType} />
                    </Grid>
                    <Grid item xs={1} />
                </React.Fragment>
            )
        }
        return gridComponentList
    }, [gridConfigList])

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <Grid container>
                {extractionGridComponentList}
            </Grid>
        </React.Fragment>
    );
}
