import * as React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TFLog from './TFLog';
import TerraformButton from '../terraform/TerraformButton';
import EfficientAccordion from './EfficientAccordion';
import { NB_MAX_TARGETS } from './ResultDrawerListSchema';
import { ALL } from './ResultDrawerDetailsAll';
import { getTimestampActionId } from '../date/DateFormatter';


export const planActionLabel = "Terraform Plan"
export const applyActionLabel = "Terraform Apply"

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

            if (terraformAction === planActionLabel) {
                newActionCompleted['history'][id]['lastTerraformParams'] = terraformParams
            }

            for (const columnUpdateInfo of Object.values(terraformParams)) {
                const { module, unique_name: uniqueName } = columnUpdateInfo

                const prefix = "dynatrace_"
                let module_trimmed = module
                if (module_trimmed.startsWith(prefix)) {
                    module_trimmed = module_trimmed.slice(prefix.length)
                }

                if (module_trimmed in newActionCompleted) {
                    // pass
                } else {
                    newActionCompleted[module_trimmed] = {}
                }
                if (uniqueName in newActionCompleted[module_trimmed]) {
                    // pass
                } else {
                    newActionCompleted[module_trimmed][uniqueName] = {}
                }
                newActionCompleted[module_trimmed][uniqueName] = id
            }

            setActionCompleted(newActionCompleted)

            const { ui_payload } = data
            if (ui_payload) {
                if (setExtractedData) {
                    setExtractedData(ui_payload)
                }
            }
        }
    }, [actionCompleted, setActionCompleted, setExtractedData])
}


export function useGenTerraformActionComponent(actionCompleted, handleTerraformCallComplete, lastActionsInfo, setLastActionsInfo) {

    return React.useCallback((lastActionId, setActionId, nbUpdate, terraformParams, module, uniqueName, nbUpdateError, planAPI, applyAPI) => {

        let actionId = ""
        if (module && uniqueName && actionCompleted && actionCompleted[module] && actionCompleted[module][uniqueName]) {
            actionId = actionCompleted[module][uniqueName]
        } else if (module === ALL) {
            actionId = lastActionId
        }

        let isPlanDone = false
        let isApplyDone = false

        let actionDetails = []
        let updateObjectList = []

        let previousPlanTerraformParams = terraformParams

        if (actionId
            && actionId !== ""
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
                if (terraformActionCompletedLabel === applyActionLabel) {
                    isApplyDone = true
                }
            }

            if ('log' in actionInfo) {

                const { is_plan_done, apply_complete } = actionInfo['log']

                if (terraformActionCompletedLabel === planActionLabel
                    && is_plan_done === true) {
                    isPlanDone = true
                }

                if (terraformActionCompletedLabel === applyActionLabel
                    && apply_complete === true) {
                    isApplyDone = true
                }

            }

            const { lastTerraformParams } = actionInfoObject

            if (lastTerraformParams) {
                previousPlanTerraformParams = lastTerraformParams
            }

            const actionList = [planActionLabel, applyActionLabel]
            for (const actionLabel of Object.values(actionList)) {
                if (actionLabel in actionInfoObject) {
                    // pass
                } else {
                    continue
                }
                const actionInfo = actionInfoObject[actionLabel]

                if (actionInfo) {
                    // pass
                } else {
                    continue
                }
                const { log } = actionInfo
                if (log) {
                    // pass
                } else {
                    continue
                }

                actionDetails.push(
                    <TFLog historyItemLog={log} actionLabel={actionLabel} actionId={actionId} />
                )
            }

        }

        if (nbUpdate > 0) {
            const handleTerraformCallCompletePlan = (data) => { handleTerraformCallComplete(data, planActionLabel, terraformParams) }
            const getActionId = () => {
                const newLastActionsInfo = { ...lastActionsInfo }
                const newActionInfoLabel = "newLastActionsInfo"
                if (newActionInfoLabel in newLastActionsInfo) {
                    // pass
                } else {
                    newLastActionsInfo[newActionInfoLabel] = lastActionId
                }
                newLastActionsInfo[newActionInfoLabel] = getTimestampActionId()
                setActionId(newLastActionsInfo[newActionInfoLabel])
                newLastActionsInfo[module] = newLastActionsInfo[newActionInfoLabel]

                setLastActionsInfo(newLastActionsInfo)

                return newLastActionsInfo[newActionInfoLabel]
            }
            updateObjectList.push(
                <Box sx={{ ml: -1 }}>
                    <TerraformButton terraformAPI={planAPI} terraformParams={terraformParams}
                        handleChange={handleTerraformCallCompletePlan} getActionId={getActionId}
                        label={"Terraform Plan ( " + nbUpdate + " configs selected, will create a new plan )" /*+ genTooManyLabel(nbUpdate)*/} confirm={false}
                    />
                </Box>
            )
        }
        if (actionId !== "") {
            const handleTerraformCallCompleteApply = (data) => { handleTerraformCallComplete(data, applyActionLabel, terraformParams) }
            const getActionIdApply = () => {
                return actionId
            }

            let applyDisabled = false
            let applyParenthesisLabel = "Will apply the plan below, regardless of the current selection"

            if (isApplyDone) {
                applyDisabled = true
                applyParenthesisLabel = "Disabled, already applied"

            } else if (!isPlanDone) {
                applyDisabled = true
                applyParenthesisLabel = "Disabled, a plan must be run before it is applied"

            } else if ("" + lastActionId !== "" + actionId) {
                applyDisabled = true
                applyParenthesisLabel = "Disabled, is not the latest action"
            }

            updateObjectList.push(
                <Box sx={{ ml: -1 }}>
                    <TerraformButton terraformAPI={applyAPI} terraformParams={previousPlanTerraformParams}
                        handleChange={handleTerraformCallCompleteApply} getActionId={getActionIdApply}
                        label={"Terraform Apply '" + actionId + "' ( " + applyParenthesisLabel + " )"} confirm={true}
                        disabled={applyDisabled} />
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
    }, [actionCompleted, handleTerraformCallComplete, lastActionsInfo, setLastActionsInfo])
}

/*
const genTooManyLabel = (genTooManyLabel) => {
    if (genTooManyLabel > NB_MAX_TARGETS) {
        return " ( More than 40 items: items with dependencies will not be pushed )"
    } else {
        return ""
    }
}
*/