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

import { Grid, Paper, Typography } from '@mui/material';
import * as React from 'react';
import { useMigrationGridConfig } from '../migrationGrid/useMigrationGridConfig';
import ExtractConfigs from './ExtractConfigs';
import ExtractEntities from './ExtractEntities';
import ExtractionCliRequestsInfo from './ExtractionCliRequestsInfo';
import MigrateButtonControlled from '../migrate/MigrateButtonControlled';
import ExecutionOptions from '../options/ExecutionOptions';
import { usePostProcessEntityFilter } from '../migrate/PostProcessHooks';
import { TENANT_KEY_TYPE_MAIN } from '../context/TenantListContext';

export default function ExtractionSection() {
    const [isOldCacheConfigsSource, setIsOldCacheConfigsSource] = React.useState(true)
    const [isOldCacheConfigsTarget, setIsOldCacheConfigsTarget] = React.useState(true)
    const [isOldCacheEntitiesSource, setIsOldCacheEntitiesSource] = React.useState(true)
    const [isOldCacheEntitiesTarget, setIsOldCacheEntitiesTarget] = React.useState(true)
    const gridConfigList = useMigrationGridConfig()

    const entityFilter = usePostProcessEntityFilter()

    const extractionGridComponentList = React.useMemo(() => {

        let gridComponentList = []

        for (const keyType of gridConfigList) {

            let setIsOldCacheConfigs = setIsOldCacheConfigsTarget
            let setIsOldCacheEntities = setIsOldCacheEntitiesTarget
            if (keyType === TENANT_KEY_TYPE_MAIN) {
                setIsOldCacheConfigs = setIsOldCacheConfigsSource
                setIsOldCacheEntities = setIsOldCacheEntitiesSource
            }

            gridComponentList.push(
                <React.Fragment key={keyType}>
                    <Grid item xs={5} id={keyType}>
                        <ExtractConfigs tenantKeyType={keyType} setIsOldCache={setIsOldCacheConfigs} />
                        <ExtractEntities tenantKeyType={keyType} setIsOldCache={setIsOldCacheEntities} />
                        <ExtractionCliRequestsInfo tenantKeyType={keyType} />
                    </Grid>
                    <Grid item xs={1} />
                </React.Fragment>
            )
        }
        return gridComponentList
    }, [gridConfigList])

    const [cacheTitleColor, prepareTitleColor] = React.useMemo(() => {
        let cacheTitleColor = null
        let prepareTitleColor = "primary.main"
        if(isOldCacheConfigsSource || isOldCacheConfigsTarget || isOldCacheEntitiesSource || isOldCacheEntitiesTarget) {
            cacheTitleColor = "primary.main"
            prepareTitleColor = null
        }

        return [cacheTitleColor, prepareTitleColor]
    }, [isOldCacheConfigsSource, isOldCacheConfigsTarget, isOldCacheEntitiesSource, isOldCacheEntitiesTarget])

    return (
        <React.Fragment>
            <Paper sx={{ mt: 5, p: 1 }} elevation={3} >
                <Typography align='center' variant='h4' color={cacheTitleColor}>Cache Management</Typography>
                <Grid container>
                    {extractionGridComponentList}
                </Grid>
            </Paper>
            <Paper sx={{ mt: 5, p: 1 }} elevation={3} >
                <Typography align='center' variant='h4' color={prepareTitleColor}>OneTopology & TerraComposer</Typography>
                <ExecutionOptions />
                {genWarningOldCache(isOldCacheConfigsSource, isOldCacheConfigsTarget, isOldCacheEntitiesSource, isOldCacheEntitiesTarget)}
                <MigrateButtonControlled handleChange={() => { }}
                    entityFilter={entityFilter}
                    label={"Prepare for migration, do this when extractions are completed"}
                    confirm={true} descLabel={""} />
            </Paper>
        </React.Fragment >
    );
}

function genWarningOldCache(isOldCacheConfigsSource, isOldCacheConfigsTarget, isOldCacheEntitiesSource, isOldCacheEntitiesTarget) {

    let title = null
    let warningTarget = null
    let warningSource = null

    if (isOldCacheConfigsSource || isOldCacheConfigsTarget || isOldCacheEntitiesSource || isOldCacheEntitiesTarget) {
        // pass
    } else {
        return null
    }

    let titleColor = "secondary.main"


    if (isOldCacheConfigsTarget || isOldCacheEntitiesTarget) {

        titleColor = "error.main"

        warningTarget = (
            <Typography key="oldCacheWarningTarget" sx={{ ml: 2, mb: 2 }} color="error.main" >
                <b>Target</b> Environment: Some configs will look like they are missing.
                <br />Recommended: extract fresh caches
            </Typography>
        )
    }

    if (isOldCacheConfigsSource || isOldCacheEntitiesSource) {
        warningSource = (
            <Typography key="oldCacheWarningSource" sx={{ ml: 2, mb: 2 }} color="secondary.main" >
                <b>Source</b> Environment: Using an old cache for the is a good way to apply configs from a backup.
                <br />If this is not your intent, it is recommended to extract fresh caches.
            </Typography>
        )
    }

    title = (
        <Typography key="titleOldCacheWarning" variant="h6" sx={{ mt: 2 }} color={titleColor} >
            Using caches extracted more than 12h ago:
        </Typography>
    )


    return (
        <React.Fragment>
            {title}
            {warningTarget}
            {warningSource}
        </React.Fragment>
    )
}
