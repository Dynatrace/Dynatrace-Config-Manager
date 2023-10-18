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
