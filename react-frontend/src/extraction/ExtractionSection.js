import { Grid, Paper } from '@mui/material';
import * as React from 'react';
import { useMigrationGridConfig } from '../migrationGrid/useMigrationGridConfig';
import ExtractConfigs from './ExtractConfigs';
import ExtractEntities from './ExtractEntities';
import MonacoRequestsInfo from './MonacoRequestsInfo';
import MigrateButtonControlled from '../migrate/MigrateButtonControlled';
import ExecutionOptions from '../options/ExecutionOptions';
import { useHistoryState } from '../context/HistoryContext'
import { getTimestampActionId } from '../date/DateFormatter';

export default function ExtractionSection() {
    const gridConfigList = useMigrationGridConfig()
    const { setLastPlanAllActionId } = useHistoryState()

    const getActionId = React.useCallback(() => {
        const newActionId = getTimestampActionId()
        setLastPlanAllActionId(newActionId)
        return newActionId
    }, [setLastPlanAllActionId])

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
            <Paper sx={{ mt: 5, p: 1 }} elevation={3} >
                <ExecutionOptions />
                <MigrateButtonControlled handleChange={() => { }}
                    entityFilter={{ 'applyMigrationChecked': true, getActionIdFunc: getActionId }}
                    label={"Post-Process extracted files, do this when extractions are completed (Terraform cli)"}
                    confirm={true} descLabel={""} />
            </Paper>
            <Paper sx={{ mt: 5, p: 1 }} elevation={3} >
                <Grid container>
                    {extractionGridComponentList}
                </Grid>
            </Paper>
        </React.Fragment>
    );
}
