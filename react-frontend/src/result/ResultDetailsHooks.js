import * as React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TFLog from './TFLog';
import TerraformButton from '../terraform/TerraformButton';
import EfficientAccordion from './EfficientAccordion';
import { NB_MAX_TARGETS } from './ResultDrawerListSchema';


export function useHandleTerraformCallComplete(actionCompleted, setActionCompleted, setExtractedData = null) {


    return React.useCallback((data, terraformAction, terraformParams) => {
        if (data == null) {
            // pass
        } else {
            if ('action_id' in data) {
                // pass
            } else {
                return
            }

            const id = data['action_id']
            let newActionCompleted = { ...actionCompleted }

            if (newActionCompleted['history']) {
                // pass
            } else {
                newActionCompleted['history'] = {}
            }

            if (id in newActionCompleted['history']) {
                // pass
            } else {
                newActionCompleted['history'][id] = {}
            }

            if (terraformAction in newActionCompleted['history'][id]) {
                // pass
            } else {
                newActionCompleted['history'][id][terraformAction] = {}
            }

            if ('aggregate_error' in data) {
                newActionCompleted['history'][id][terraformAction]['aggregate_error'] = data['aggregate_error']
            }
            if ('log_dict' in data) {
                newActionCompleted['history'][id][terraformAction]['log'] = data['log_dict']
            }
            newActionCompleted['history'][id]['lastTerraformAction'] = terraformAction

            for (const columnUpdateInfo of Object.values(terraformParams)) {
                const { module_trimmed: module, unique_name: uniqueName } = columnUpdateInfo

                if (module in newActionCompleted) {
                    // pass
                } else {
                    newActionCompleted[module] = {}
                }
                if (uniqueName in newActionCompleted[module]) {
                    // pass
                } else {
                    newActionCompleted[module][uniqueName] = {}
                }
                newActionCompleted[module][uniqueName] = id
            }

            setActionCompleted(newActionCompleted)

            const {ui_payload} = data
            if (ui_payload) {
                if (setExtractedData) {
                    setExtractedData(ui_payload)
                }
            }
        }
    }, [actionCompleted, setActionCompleted, setExtractedData])
}


export function useGenTerraformActionComponent(actionCompleted, handleTerraformCallComplete, lastActionId, setLastActionId) {

    return React.useCallback((actionId, nbUpdate, terraformParams, module, uniqueName, nbUpdateError, planAPI, applyAPI) => {
        
        if (module && uniqueName && actionCompleted && actionCompleted[module] && actionCompleted[module][uniqueName]) {

            actionId = actionCompleted[module][uniqueName]

        }

        const planActionLabel = "Terraform Plan"
        const applyActionLabel = "Terraform Apply"
        let isPlanDone = false
        let isApplyDone = false

        let actionDetails = []
        let updateObjectList = []

        if (actionId
            && actionId > 0
            && 'history' in actionCompleted
            && actionId in actionCompleted['history']) {

            const actionInfoObject = actionCompleted['history'][actionId]
            const terraformActionCompletedLabel = actionInfoObject['lastTerraformAction']
            const actionInfo = actionInfoObject[terraformActionCompletedLabel]

            if ('aggregate_error' in actionInfo) {
                actionDetails.push(
                    <Typography sx={{ ml: 3 }} color="error.light" variant="h5">{terraformActionCompletedLabel + " failed with message: "}</Typography>
                )
                actionDetails.push(
                    <Typography sx={{ ml: 3 }} color="error.light" variant="h6">See Terraform Plan Log below for additional info</Typography>
                )
                actionDetails.push(
                    <Typography sx={{ ml: 3 }} color="error.light">{actionInfo['aggregate_error']}</Typography>
                )
            }
            
            if ('log' in actionInfo) {

                const { is_plan_done, no_changes, apply_complete, modules } = actionInfo['log']

                if (terraformActionCompletedLabel === planActionLabel
                    && is_plan_done === true) {
                    isPlanDone = true
                }

                if (terraformActionCompletedLabel === planActionLabel
                    && no_changes === true) {
                    actionDetails.push(
                        <Typography sx={{ ml: 3 }} color="secondary.main" variant="h5">{terraformActionCompletedLabel + " executed. No Changes."}</Typography>
                    )
                }

                if (terraformActionCompletedLabel === applyActionLabel
                    && apply_complete === true) {
                    isApplyDone = true
                    actionDetails.push(
                        <Typography sx={{ ml: 3 }} color="success.light" variant="h4">{terraformActionCompletedLabel + " executed!"}</Typography>
                    )
                }

            }


            const actionList = [applyActionLabel, planActionLabel]
            for (const actionLabel of Object.values(actionList)) {
                if (actionLabel in actionInfoObject) {
                    // pass
                } else {
                    continue
                }
                const actionInfo = actionInfoObject[actionLabel]
                
                if(actionInfo) {
                    // pass
                } else {
                    continue
                }
                const { log } = actionInfo
                if(log) {
                    // pass
                } else {
                    continue
                }
                const { modules, other_lines } = log

                actionDetails.push(
                    <TFLog logs={modules} other={other_lines} actionLabel={actionLabel} actionId={actionId} />
                )
            }

        }

        if (nbUpdate > 0) {
            const handleTerraformCallCompletePlan = (data) => { handleTerraformCallComplete(data, planActionLabel, terraformParams) }
            const getActionId = () => {
                const newLastActionId = { ...lastActionId }
                const newActionIdLabel = "newActionId"
                if (newActionIdLabel in newLastActionId) {
                    // pass
                } else {
                    newLastActionId[newActionIdLabel] = 0
                }
                newLastActionId[newActionIdLabel]++
                newLastActionId[module] = newLastActionId[newActionIdLabel]

                setLastActionId(newLastActionId)

                return newLastActionId[newActionIdLabel]
            }
            updateObjectList.push(
                <Box sx={{ ml: -1 }}>
                    <TerraformButton terraformAPI={planAPI} terraformParams={terraformParams}
                        handleChange={handleTerraformCallCompletePlan} getActionId={getActionId}
                        label={"Terraform Plan ( " + nbUpdate + " configs selected, will create a new plan )" + genTooManyLabel(nbUpdate)} confirm={false} 
                        disabled={nbUpdate > NB_MAX_TARGETS}/>
                </Box>
            )
        }
        if (actionId > 0) {
            const handleTerraformCallCompleteApply = (data) => { handleTerraformCallComplete(data, applyActionLabel, terraformParams) }
            const getActionIdApply = () => {
                return actionId
            }
            updateObjectList.push(
                <Box sx={{ ml: -1 }}>
                    <TerraformButton terraformAPI={applyAPI} terraformParams={terraformParams}
                        handleChange={handleTerraformCallCompleteApply} getActionId={getActionIdApply}
                        label={"Terraform Apply action_" + actionId + " ( Will apply the plan below, regardless of the current selection )"} confirm={true}
                        disabled={!isPlanDone || isApplyDone} />
                </Box>
            )
        }

        updateObjectList = updateObjectList.concat(actionDetails)

        const updateComponent = (

            <React.Fragment>
                {(nbUpdate > 0 || nbUpdateError > 0) ?
                    <Paper sx={{ ml: 1, mt: 2 }}>
                        <EfficientAccordion
                            defaultExpanded={true}
                            label="Action details: "
                            labelColor={null}
                            componentList={updateObjectList} />
                    </Paper>
                    : null}
            </React.Fragment>
        )
        return updateComponent
    }, [actionCompleted, handleTerraformCallComplete, lastActionId, setLastActionId])
}


const genTooManyLabel = (genTooManyLabel) => {
    if (genTooManyLabel > NB_MAX_TARGETS) {
        return " (DISABLED: too many items)"
    } else {
        return ""
    }
}