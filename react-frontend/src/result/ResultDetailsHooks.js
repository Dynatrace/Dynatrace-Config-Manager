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
import { Box, Paper, Typography } from '@mui/material';
import TFLog, { genTerraformExecutionLabelPrefix } from './TFLog';
import TerraformButton from '../terraform/TerraformButton';
import EfficientAccordion from './EfficientAccordion';
import { ALL } from './ResultDrawerDetailsAll';
import { getTimestampActionId } from '../date/DateFormatter';
import StatsBar from './StatsBar';


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

        if (nbUpdate > 0 || nbUpdateError > 0) {
            // pass
        } else {
            return null
        }

        let actionId = ""
        if (module && uniqueName && actionCompleted && actionCompleted[module] && actionCompleted[module][uniqueName]) {
            actionId = actionCompleted[module][uniqueName]
        } else if (module === ALL) {
            actionId = lastActionId
        }

        const { actionDetails, isApplyDone, isPlanDone, previousPlanTerraformParams } = genActionDetails(actionId, actionCompleted, terraformParams)
        const planButton = genPlanButton(nbUpdate, handleTerraformCallComplete, terraformParams, lastActionsInfo, lastActionId, setActionId, module, setLastActionsInfo, planAPI);
        const applyButton = genApplyButton(actionId, handleTerraformCallComplete, terraformParams, isApplyDone, isPlanDone, lastActionId, applyAPI, previousPlanTerraformParams);
        const [planFocusProps, applyFocusProps] = genFocusProps(isApplyDone, isPlanDone)

        let actionDetailsLabel = "Push selected configurations"
        let actionDetailsVariant = "h6"
        let allLabel = ""
        if (module === ALL) {
            actionDetailsLabel = (<b>Push all configurations</b>)
            actionDetailsVariant = "h5"
            allLabel = "ALL"
        }

        return (
            <React.Fragment>
                <Paper sx={{ ml: 1, mt: 2, overflow: "auto" }}>
                    <Box sx={{ m: 2 }}>
                        <Typography variant={actionDetailsVariant}>{actionDetailsLabel}</Typography>
                        <Box>
                            <Typography {...planFocusProps}>1. PLAN {allLabel} AND REVIEW</Typography>
                            {planButton}
                            {actionDetails[planActionLabel]}
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography {...applyFocusProps}>2. PUSH {allLabel} CONFIGURATIONS </Typography>
                            {applyButton}
                            {actionDetails[applyActionLabel]}
                        </Box>

                    </Box>
                </Paper>
            </React.Fragment>
        )
    }, [actionCompleted, handleTerraformCallComplete, lastActionsInfo, setLastActionsInfo])
}


function genFocusProps(isApplyDone, isPlanDone) {

    let isPlanFocused = true
    if (isApplyDone || isPlanDone) {
        isPlanFocused = false
    }

    const focusProps = { variant: "h6", color: "primary" }
    if (isPlanFocused) {
        return [focusProps, {}]
    }
    return [{}, focusProps]
}


function genApplyButton(actionId, handleTerraformCallComplete, terraformParams, isApplyDone, isPlanDone, lastActionId, applyAPI, previousPlanTerraformParams) {
    let applyButton = null;
    if (actionId !== "") {
        const handleTerraformCallCompleteApply = (data) => { handleTerraformCallComplete(data, applyActionLabel, terraformParams); };
        const getActionIdApply = () => {
            return actionId;
        };

        let applyDisabled = true;
        let applyParenthesisLabel = "Will apply the plan below, regardless of the current selection";

        if (isApplyDone) {
            applyParenthesisLabel = "Disabled, already applied";

        } else if (!isPlanDone) {
            applyParenthesisLabel = "Disabled, a plan must be run before it is applied";

        } else if ("" + lastActionId !== "" + actionId) {
            applyParenthesisLabel = "Disabled, is not the latest action";
        } else {
            applyDisabled = false
        }

        applyButton = (
            <Box key="tfApply" sx={{ ml: -1 }}>
                <TerraformButton key={actionId} terraformAPI={applyAPI} terraformParams={previousPlanTerraformParams}
                    handleChange={handleTerraformCallCompleteApply} getActionId={getActionIdApply}
                    label={"Terraform Apply '" + actionId + "' ( " + applyParenthesisLabel + " )"} confirm={true}
                    disabled={applyDisabled} />
            </Box>
        );
    }
    return applyButton;
}

function genPlanButton(nbUpdate, handleTerraformCallComplete, terraformParams, lastActionsInfo, lastActionId, setActionId, module, setLastActionsInfo, planAPI) {
    let planButton = null;
    if (nbUpdate > 0) {
        const handleTerraformCallCompletePlan = (data) => { handleTerraformCallComplete(data, planActionLabel, terraformParams); };
        const getActionId = () => {
            const newLastActionsInfo = { ...lastActionsInfo };
            const newActionInfoLabel = "newLastActionsInfo";
            if (newActionInfoLabel in newLastActionsInfo) {
                // pass
            } else {
                newLastActionsInfo[newActionInfoLabel] = lastActionId;
            }
            newLastActionsInfo[newActionInfoLabel] = getTimestampActionId();
            setActionId(newLastActionsInfo[newActionInfoLabel]);
            newLastActionsInfo[module] = newLastActionsInfo[newActionInfoLabel];

            setLastActionsInfo(newLastActionsInfo);

            return newLastActionsInfo[newActionInfoLabel];
        };
        planButton = (
            <Box key="tfPlan" sx={{ ml: -1 }}>
                <TerraformButton terraformAPI={planAPI} terraformParams={terraformParams}
                    handleChange={handleTerraformCallCompletePlan} getActionId={getActionId}
                    label={"Terraform Plan ( " + nbUpdate + " configs selected, will create a new plan )" /*+ genTooManyLabel(nbUpdate)*/} confirm={false} />
            </Box>
        );
    }
    return planButton;
}

function genActionDetails(actionId, actionCompleted, terraformParams) {
    let isPlanDone = false
    let isApplyDone = false
    let previousPlanTerraformParams = terraformParams

    let actionDetails = { [applyActionLabel]: [], [planActionLabel]: [] };

    if (actionId
        && actionId !== ""
        && 'history' in actionCompleted
        && actionId in actionCompleted['history']) {

        const actionInfoObject = actionCompleted['history'][actionId];
        const terraformActionCompletedLabel = actionInfoObject['lastTerraformAction'];
        const actionInfo = actionInfoObject[terraformActionCompletedLabel];

        if ('aggregate_error' in actionInfo) {
            actionDetails[terraformActionCompletedLabel].push(
                <Typography sx={{ ml: 3 }} color="warning.light" variant="h5">{terraformActionCompletedLabel + " completed with errors: "}</Typography>
            );
            actionDetails[terraformActionCompletedLabel].push(
                <Typography sx={{ ml: 3 }} color="warning.light" variant="h6">See {genTerraformExecutionLabelPrefix(terraformActionCompletedLabel)} Log below for additional info</Typography>
            );
            if (terraformActionCompletedLabel === applyActionLabel) {
                isApplyDone = true;
            }
        }

        if ('log' in actionInfo) {

            const { is_plan_done, apply_complete } = actionInfo['log'];

            if (terraformActionCompletedLabel === planActionLabel
                && is_plan_done === true) {
                isPlanDone = true;
            }

            if (terraformActionCompletedLabel === applyActionLabel
                && apply_complete === true) {
                isApplyDone = true;
            }

        }

        const { lastTerraformParams } = actionInfoObject;

        if (lastTerraformParams) {
            previousPlanTerraformParams = lastTerraformParams;
        }

        const actionList = [planActionLabel, applyActionLabel];
        for (const actionLabel of Object.values(actionList)) {
            if (actionLabel in actionInfoObject) {
                // pass
            } else {
                continue;
            }
            const actionInfo = actionInfoObject[actionLabel];

            if (actionInfo) {
                // pass
            } else {
                continue;
            }
            const { log } = actionInfo;
            if (log) {
                // pass
            } else {
                continue;
            }
            if (log?.stats) {
                actionDetails[actionLabel].push(<StatsBar stats={log.stats} />);
            }
            actionDetails[actionLabel].push(
                <TFLog historyItemLog={log} actionLabel={actionLabel} actionId={actionId} hideStats />
            );
        }

    }
    return { actionDetails, isApplyDone, isPlanDone, previousPlanTerraformParams };
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