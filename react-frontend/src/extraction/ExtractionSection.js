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
import { useTerraformExecDetails } from './useTerraformExecDetails';
import { useOneTopologyExecDetails } from './useOneTopologyExecDetails';
import OneTopologyReplacements from './useOneTopologyReplacements';

export default function ExtractionSection() {
    const [cacheDetailsConfigsSource, setCacheDetailsConfigsSource] = React.useState(true)
    const [cacheDetailsConfigsTarget, setCacheDetailsConfigsTarget] = React.useState(true)
    const [cacheDetailsEntitiesSource, setCacheDetailsEntitiesSource] = React.useState(true)
    const [cacheDetailsEntitiesTarget, setCacheDetailsEntitiesTarget] = React.useState(true)
    const gridConfigList = useMigrationGridConfig()
    const { isTerraformError, terraformErrorComponent, terraformInfo } = useTerraformExecDetails()
    const { isOneTopologyError, oneTopologyErrorComponent } = useOneTopologyExecDetails()

    const entityFilter = usePostProcessEntityFilter()

    const extractionGridComponentList = React.useMemo(() => {

        let gridComponentList = []

        for (const keyType of gridConfigList) {

            let setCacheDetailsConfigs = setCacheDetailsConfigsTarget
            let setCacheDetailsEntities = setCacheDetailsEntitiesTarget
            if (keyType === TENANT_KEY_TYPE_MAIN) {
                setCacheDetailsConfigs = setCacheDetailsConfigsSource
                setCacheDetailsEntities = setCacheDetailsEntitiesSource
            }

            gridComponentList.push(
                <React.Fragment key={keyType}>
                    <Grid item xs={5} id={keyType}>
                        <ExtractConfigs tenantKeyType={keyType} setCacheDetails={setCacheDetailsConfigs} />
                        <ExtractEntities tenantKeyType={keyType} setCacheDetails={setCacheDetailsEntities} />
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
        if (cacheDetailsConfigsSource["isOld"] || cacheDetailsConfigsTarget["isOld"] || cacheDetailsEntitiesSource["isOld"] || cacheDetailsEntitiesTarget["isOld"]) {
            cacheTitleColor = "primary.main"
            prepareTitleColor = null
        }

        return [cacheTitleColor, prepareTitleColor]
    }, [cacheDetailsConfigsSource, cacheDetailsConfigsTarget, cacheDetailsEntitiesSource, cacheDetailsEntitiesTarget])

    const isCacheIncomplete = React.useMemo(() => {
        if (cacheDetailsConfigsSource["isMissing"] || cacheDetailsConfigsTarget["isMissing"] || cacheDetailsEntitiesSource["isMissing"] || cacheDetailsEntitiesTarget["isMissing"]) {
            return true
        }
        return false
    }, [cacheDetailsConfigsSource, cacheDetailsConfigsTarget, cacheDetailsEntitiesSource, cacheDetailsEntitiesTarget])

    return (
        <React.Fragment>
            <Paper sx={{ mt: 5, p: 1 }} elevation={3} >
                <Typography align='center' variant='h4' color={cacheTitleColor}>Cache Management</Typography>
                {
                    isOneTopologyError ?
                        oneTopologyErrorComponent
                        : <Grid container>
                            {extractionGridComponentList}
                        </Grid>
                }

            </Paper>
            <Paper sx={{ mt: 5, p: 1 }} elevation={3} >
                <Typography align='center' variant='h4' color={prepareTitleColor}>OneTopology & TerraComposer</Typography>
                {
                    isTerraformError ? terraformErrorComponent
                        : genPostProcessGrid(terraformInfo, isCacheIncomplete, cacheDetailsConfigsSource, cacheDetailsConfigsTarget, cacheDetailsEntitiesSource, cacheDetailsEntitiesTarget, entityFilter)
                }
            </Paper>
        </React.Fragment >
    );
}

function genPostProcessGrid(terraformInfo, isCacheIncomplete, cacheDetailsConfigsSource, cacheDetailsConfigsTarget, cacheDetailsEntitiesSource, cacheDetailsEntitiesTarget, entityFilter) {

    if (isCacheIncomplete) {
        return (
            <Typography sx={{ my: 6 }} variant="h4" color="secondary.main" align='center'>Please extract entities & configs for both tenants before you proceed.</Typography>
        )
    }

    return (
        <React.Fragment>
            <Grid container sx={{ mt: 2, ml: 1 }} direction={'row'}>
                <Grid item xs={5}>

                    {genWarningOldCache(cacheDetailsConfigsSource, cacheDetailsConfigsTarget, cacheDetailsEntitiesSource, cacheDetailsEntitiesTarget)}

                    <MigrateButtonControlled handleChange={() => { }}
                        entityFilter={entityFilter}
                        label={"Execute OneTopology & TerraComposer"}
                        confirm={true} descLabel={""} />
                    <Typography sx={{ ml: 1 }}>{terraformInfo}</Typography>
                </Grid>
                <Grid item xs={1} />
                <Grid item xs={5}>
                    <ExecutionOptions />
                </Grid>
                <Grid item xs={1} />
            </Grid>
            <OneTopologyReplacements/>
        </React.Fragment >
    )
}

function genWarningOldCache(cacheDetailsConfigsSource, cacheDetailsConfigsTarget, cacheDetailsEntitiesSource, cacheDetailsEntitiesTarget) {

    let title = null
    let warningTarget = null
    let warningSource = null

    if (cacheDetailsConfigsSource["isOld"] || cacheDetailsConfigsTarget["isOld"] || cacheDetailsEntitiesSource["isOld"] || cacheDetailsEntitiesTarget["isOld"]) {
        // pass
    } else {
        return null
    }

    let titleColor = "secondary.main"


    if (cacheDetailsConfigsTarget["isOld"] || cacheDetailsEntitiesTarget["isOld"]) {

        titleColor = "error.main"

        warningTarget = (
            <Typography key="oldCacheWarningTarget" sx={{ ml: 2, mb: 2 }} color="error.main" >
                <b>Target</b> Environment: Some configs will look like they are missing.
                <br />Recommended: extract fresh caches
            </Typography>
        )
    }

    if (cacheDetailsConfigsSource["isOld"] || cacheDetailsEntitiesSource["isOld"]) {
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
