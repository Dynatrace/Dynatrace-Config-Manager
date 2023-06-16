import { Paper } from '@mui/material';
import * as React from 'react';
import EfficientAccordion from './EfficientAccordion';
import { STATUS_COLORS, STATUS_LABELS } from '../extraction/HorizontalStackedBar';
import TFAnsiText from './TFAnsiText';


export default function TFLog({ logs, other, actionLabel, actionId }) {

    return (
        ((logs == null || Object.keys(logs).length === 0) && other == null) ? null :
            <Paper sx={{ ml: -1, mt: 2 }}>
                <EfficientAccordion
                    label={"Planned changes details " + actionLabel + ", based on action_" + actionId}
                    labelColor="secondary.dark"
                    labelVariant="h6"
                    defaultExpanded={false}
                    componentList={
                        [
                            other == null ? null :
                                <EfficientAccordion
                                    label="General execution info"
                                    labelColor={STATUS_COLORS["Other"]}
                                    labelVariant="h6"
                                    defaultExpanded={false}
                                    componentList={
                                        [<TFAnsiText logList={other} />]
                                    }
                                />,
                            genLogComponents(logs),
                        ]
                    }
                />
            </Paper>

    )
}

function genLogComponents(logMap) {

    if (logMap) {
        // pass
    } else {
        return null
    }

    let resourceComponents = []

    for (const logModule of Object.values(logMap)) {
        for (const resourceLog of Object.values(logModule)) {
            const { module, resource, action_code, module_lines } = resourceLog

            resourceComponents.push(
                <EfficientAccordion
                    label={STATUS_LABELS[action_code] + ": " + module + " " + resource}
                    labelColor={STATUS_COLORS[action_code]}
                    labelVariant="h6"
                    defaultExpanded={false}
                    componentList={
                        [<TFAnsiText logList={module_lines} />]
                    }
                />
            )
        }
    }

    return resourceComponents
}
