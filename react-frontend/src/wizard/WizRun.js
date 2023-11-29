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

import { Box, Button, Grid, IconButton, Typography } from '@mui/material';
import * as React from 'react';
import { MatrixBlue, MatrixDisabled, MatrixRed, genMatrixButtonProps } from '../options/FirstTimeUser';
import { useHandleExtractConfigs, useHandleExtractEntities } from '../extraction/ExtractionHooks';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenant, useTenantKey } from '../context/TenantListContext';
import { DONE, ERROR, LOADING, NOT_STARTED } from '../progress/ProgressHook';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useHandlePostProcess } from '../migrate/PostProcessHooks';
import { useExecutionOptionsState } from '../context/ExecutionContext';
import { useHandleApplyAll } from '../migrate/ApplyAllHooks';
import StatsBar from '../result/StatsBar';

export function WizRun({ showNextTab }) {


  const { tenantKey: tenantKeySource } = useTenantKey(TENANT_KEY_TYPE_MAIN)
  const { tenant: { label: labelSource } } = useTenant(tenantKeySource)

  const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)
  const { tenant: { label: labelTarget } } = useTenant(tenantKeyTarget)


  const { enableDashboards, enableOmitDestroy, setEnableDashboards, setEnableOmitDestroy, setAdvancedMode } = useExecutionOptionsState()
  React.useEffect(() => {
    if (enableDashboards !== true) {
      setEnableDashboards(true)
      return
    }
    if (enableOmitDestroy !== true) {
      setEnableOmitDestroy(true)
      return
    }
  })

  const { progress: progressConfigsSource, progressComponent: progressComponentConfigsSource, handleExtractConfigs: handleExtractConfigsSource } = useHandleExtractConfigs(tenantKeySource)
  const { progress: progressConfigsTarget, progressComponent: progressComponentConfigsTarget, handleExtractConfigs: handleExtractConfigsTarget } = useHandleExtractConfigs(tenantKeyTarget)

  const { progress: progressEntitiesSource, progressComponent: progressComponentEntitiesSource, handleExtractEntities: handleExtractEntitiesSource } = useHandleExtractEntities(tenantKeySource)
  const { progress: progressEntitiesTarget, progressComponent: progressComponentEntitiesTarget, handleExtractEntities: handleExtractEntitiesTarget } = useHandleExtractEntities(tenantKeyTarget)

  const { progress: progressPostProcess, progressComponent: progressComponentPostProcess, handlePostProcess, planStats } = useHandlePostProcess()
  const { progress: progressApplyAll, progressComponent: progressComponentApplyAll, handleApplyAll, applyStats } = useHandleApplyAll()

  const handleExtractPostProcess = React.useCallback(() => {
    handleExtractConfigsSource()
    handleExtractConfigsTarget()
  }, [handleExtractConfigsSource, handleExtractConfigsTarget])

  const handleAdvanced = React.useCallback(() => {
    setAdvancedMode(true)
  }, [setAdvancedMode])

  React.useEffect(() => {
    if (progressConfigsSource === DONE && progressEntitiesSource === NOT_STARTED) {
      handleExtractEntitiesSource()
    }
  }, [progressConfigsSource])

  React.useEffect(() => {
    if (progressConfigsTarget === DONE && progressEntitiesTarget === NOT_STARTED) {
      handleExtractEntitiesTarget()
    }
  }, [progressConfigsTarget])

  React.useEffect(() => {
    if (progressEntitiesSource === DONE && progressEntitiesTarget === DONE && progressPostProcess === NOT_STARTED) {
      handlePostProcess()
    }
  }, [progressEntitiesSource, progressEntitiesTarget])

  const [prepareButtonColor, prepareButtonMessage, prepareButtonDisabled] = React.useMemo(() => {
    const disabled = progressConfigsSource !== NOT_STARTED || progressConfigsTarget !== NOT_STARTED
    if (disabled) {
      if (progressPostProcess === DONE) {
        return [MatrixDisabled, "Completed", disabled]
      } else {
        return [MatrixDisabled, "Running. this could take a while...", disabled]
      }
    }
    return [MatrixBlue, "Prepare for migration", disabled]
  }, [progressConfigsSource, progressConfigsTarget, progressPostProcess])

  const [pushAllButtonColor, pushAllButtonMessage, pushAllButtonDisabled] = React.useMemo(() => {
    if (progressPostProcess === DONE) {
      if (progressApplyAll === NOT_STARTED) {
        return [MatrixBlue, "Push all configs", false]
      } else if (progressApplyAll === DONE) {
        return [MatrixDisabled, "Completed", true]
      } else {
        return [MatrixDisabled, "Running. this could take a while...", true]
      }
    }
    return [MatrixDisabled, "Push all configs", true]
  }, [progressPostProcess, progressApplyAll])

  const [advancedButtonColor, advancedButtonMessage, advancedButtonDisabled] = React.useMemo(() => {
    if (progressPostProcess === DONE) {
      if (progressApplyAll === NOT_STARTED) {
        return [MatrixRed, "Switch to advanced", false]
      } else {
        return [MatrixDisabled, "Switch to advanced", true]
      }
    }
    return [MatrixDisabled, "Switch to advanced", true]
  }, [progressPostProcess, progressApplyAll])

  const [advanced2ButtonColor, advanced2ButtonMessage, advanced2ButtonDisabled] = React.useMemo(() => {
    if (progressApplyAll === DONE) {
      return [MatrixRed, "Switch to advanced", false]
    }
    return [MatrixDisabled, "Switch to advanced", true]
  }, [progressApplyAll])

  return (
    <React.Fragment>
      <Typography sx={{ ml: 4 }} variant="h6">
        Source: {labelSource}
      </Typography>
      <Typography sx={{ ml: 4, mb: 2 }} variant="h6">
        Target: {labelTarget}
      </Typography>

      {progressApplyAll !== NOT_STARTED ? null
        : (
          <Grid container>
            <Grid item xs={6}>
              <Box sx={{ ml: 4 }}>
                <Button {...genMatrixButtonProps(prepareButtonColor)} disabled={prepareButtonDisabled} onClick={handleExtractPostProcess}>{prepareButtonMessage}</Button>
                {genStatusComponent(progressConfigsSource, progressComponentConfigsSource, "Extract source tenant configs")}
                {genStatusComponent(progressConfigsTarget, progressComponentConfigsTarget, "Extract target tenant configs")}
                {genStatusComponent(progressEntitiesSource, progressComponentEntitiesSource, "Extract source tenant entities")}
                {genStatusComponent(progressEntitiesTarget, progressComponentEntitiesTarget, "Extract target tenant entities")}
                {genStatusComponent(progressPostProcess, progressComponentPostProcess, "Execute OneTopology & TerraComposer")}
              </Box>
            </Grid>
            <Grid item xs={5}>
              <Box sx={{ ml: 4 }}>
                <Typography variant='h6'>
                  Migration of configs:
                </Typography>
                <Typography sx={{ ml: 2 }}>
                  This is a complex multiple step action
                  <br /> Depending on the size of tenants, it could take a while.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      {progressPostProcess !== DONE ? null
        : (
          <Grid sx={{ mt: 6 }} container>
            <Grid item xs={6}>
              <Box sx={{ ml: 4 }}>
                <Typography color="black" variant={"h6"}>Status prior to migration</Typography>
                <StatsBar stats={planStats} />
                <Typography sx={{ ml: 2 }}>
                  <br /> Ready to Add and Change configurations in your Target environment.
                </Typography>
                <Typography sx={{ ml: 2 }}>
                  <br /> - If you need more control, switch to Advanced mode and go to the Manage Configs Tab.
                </Typography>
                <Button sx={{ mx: 2, mt: 4 }} {...genMatrixButtonProps(pushAllButtonColor)} disabled={pushAllButtonDisabled} onClick={handleApplyAll}>{pushAllButtonMessage}</Button>
                {progressApplyAll !== NOT_STARTED ?
                  null
                  :
                  <Button sx={{ mx: 2, mt: 4 }} {...genMatrixButtonProps(advancedButtonColor)} disabled={advancedButtonDisabled} onClick={handleAdvanced}>{advancedButtonMessage}</Button>
                }
                {genStatusComponent(progressApplyAll, progressComponentApplyAll, "Push all configs")}
              </Box>
            </Grid>
            <Grid item xs={5}>
              <Box sx={{ ml: 4 }}>
                <Typography sx={{ ml: 2 }}>
                  3. Push configs:
                </Typography>
                <Typography sx={{ ml: 4 }}>
                  - Run a terraform Apply
                </Typography>
                <Typography sx={{ ml: 2 }}>
                  <br /> a. Before a migration: Configurations will be pre-pushed even if your entities are not migrated.
                  <br /> <br /> b. After a migration: Some entities will be given a different ID in the Target tenant.
                </Typography>
                <Typography sx={{ ml: 4 }}>
                  - OneTopology will update configurations with the new IDs
                  <br /> - Running this tool after migrating entities will help you avoid missing configs.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      {progressApplyAll !== DONE ? null
        : (
          <Grid sx={{ mt: 6 }} container>
            <Grid item xs={6}>
              <Box sx={{ ml: 4 }}>
                <Typography color="black" variant={"h6"}>Status post migration</Typography>
                <StatsBar stats={applyStats} />
                <Typography sx={{ ml: 2 }}>
                  <br /> You can now see the results of the migration
                </Typography>
                <Typography sx={{ ml: 4 }}>
                  - For now, the assisted mode only provides statistics
                  <br /> - If you want to see more details, switch to Advanced mode and go to the Manage Configs Tab.
                  <br /> - You will always be able to change between modes.
                </Typography>
                <Button sx={{ mx: 2, mt: 4 }} {...genMatrixButtonProps(advanced2ButtonColor)} disabled={advanced2ButtonDisabled} onClick={handleAdvanced}>{advanced2ButtonMessage}</Button>
              </Box>
            </Grid>
            <Grid item xs={5}>
              <Box sx={{ ml: 4 }}>
              </Box>
            </Grid>
          </Grid>
        )}
    </React.Fragment>
  );
}

function genStatusComponent(progress, progressComponent, label) {
  let statusComponent = null

  if (progress === NOT_STARTED) {
    statusComponent = (
      <IconButton color={MatrixDisabled} disableFocusRipple disableRipple disableElevation>
        <PlayCircleOutlineIcon color={MatrixDisabled} fontSize="large" />
        <Typography>{label}</Typography>
      </IconButton>
    )
  } else if (progress === LOADING) {
    statusComponent = (
      <IconButton color="primary" disableFocusRipple disableRipple disableElevation>
        {progressComponent}
        <Typography>{label}</Typography>
      </IconButton>
    )
  } else if (progress === ERROR) {
    statusComponent = (
      <IconButton color="error" disableFocusRipple disableRipple disableElevation>
        <ClearIcon color="error" fontSize="large" />
        <Typography>{label}</Typography>
      </IconButton>
    )
  } else if (progress === DONE) {
    statusComponent = (
      <IconButton color="success" disableFocusRipple disableRipple disableElevation>
        <CheckIcon color="success" fontSize="large" />
        <Typography>{label}</Typography>
      </IconButton>
    )
  }

  return (
    <Box>
      {statusComponent}
    </Box>
  )
}