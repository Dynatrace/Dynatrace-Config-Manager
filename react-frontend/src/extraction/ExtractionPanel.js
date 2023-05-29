import { Grid } from '@mui/material';
import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import { useMigrationGridConfig } from '../migrationGrid/useMigrationGridConfig';
import ExtractConfigs from './ExtractConfigs';
import ExtractEntities from './ExtractEntities';
import MonacoRequestsInfo from './MonacoRequestsInfo';
import MigrateButtonControlled from '../migrate/MigrateButtonControlled';

export default function ExtractionPanel() {
    const gridConfigList = useMigrationGridConfig()

    const extractionGridComponentList = React.useMemo(() => {

        let gridComponentList = []

        for (const keyType of gridConfigList) {

            gridComponentList.push(
                <React.Fragment>
                    <Grid item xs={5} id={keyType}>
                        <ExtractConfigs tenantType={keyType} />
                        <ExtractEntities tenantType={keyType} />
                        <MonacoRequestsInfo tenantType={keyType} />
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
            <MigrateButtonControlled handleChange={() => { }} entityFilter={{ 'applyMigrationChecked': true }} label={"Wipe terraform folder and Create new files (do this when extractions are completed)"} confirm={true} />
            <Grid container>
                {extractionGridComponentList}
            </Grid>
        </React.Fragment>
    );
}
