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

import { Paper, Typography } from '@mui/material';
import * as React from 'react';
import EfficientAccordion from './EfficientAccordion';
import { STATUS_COLORS } from '../extraction/HorizontalStackedBar';
import TFAnsiText from './TFAnsiText';
import { applyActionLabel } from './ResultDetailsHooks';
import TFLogModule from './TFLogModule';
import StatsBar from './StatsBar';


export default function TFLog({ historyItemLog: { modules: logs, other_lines: other, apply_complete, no_changes, stats },
    actionLabel, actionId, defaultExpanded = false, hideStats = false }) {


    return (
        ((logs == null || Object.keys(logs).length === 0) && other == null && stats == null) ? null
            : <Paper sx={{ ml: -1, mt: 2 }}>
                {apply_complete === true && <Typography color="success.light" variant="h4">Apply Complete</Typography>}
                {no_changes === true && <Typography color="secondary.main" variant="h5">Executed. No Changes.</Typography>}
                <EfficientAccordion
                    label={genLabel(actionLabel, actionId)}
                    labelColor="secondary.dark"
                    labelVariant="h6"
                    defaultExpanded={defaultExpanded}
                    componentList={
                        [
                            genStatsBar(stats, hideStats),
                            genGeneralInfo(other),
                            genLogComponents(logs),
                        ]
                    }
                />
            </Paper>

    )
}

function genStatsBar(stats, hideStats) {
    if (hideStats) {
        return null
    } else {
        return (
            <StatsBar stats={stats} />
        )
    }
}

function genGeneralInfo(other) {
    if (other == null || (other.length < 1)) {
        return null
    } else {
        return (
            <EfficientAccordion
                label="General execution info"
                labelColor={STATUS_COLORS["Other"]}
                labelVariant="h6"
                defaultExpanded={false}
                componentList={
                    [<TFAnsiText logList={other} />]
                }
            />
        )
    }
}

function genLogComponents(logMap) {

    if (logMap) {
        // pass
    } else {
        return null
    }

    let resourceComponents = []

    for (const [moduleDir, logModule] of Object.entries(logMap)) {
        if (Object.keys(logMap).length === 1) {
            resourceComponents.push(
                <TFLogModule key={`Log-Module-${moduleDir}`} logModule={logModule} />
            )
        } else {
            resourceComponents.push(
                <EfficientAccordion
                    key={`Accordion-Module-${moduleDir}`}
                    label={Object.keys(logModule).length + " x " + moduleDir}
                    labelColor={"black"}
                    labelVariant="h6"
                    defaultExpanded={false}
                    componentList={
                        [<TFLogModule key={`Log-Module-${moduleDir}`} logModule={logModule} />]
                    }
                />
            )

        }
    }

    return resourceComponents
}

export function genTerraformExecutionLabelPrefix(terraform_action_label) {
    let prefix = "Planned changes details"
    if (terraform_action_label === applyActionLabel) {
        prefix = "Execution details"
    }

    return prefix
}

function genLabel(terraform_action_label, actionId) {
    let prefix = genTerraformExecutionLabelPrefix(terraform_action_label)

    return prefix + " for '" + actionId + "'"
}