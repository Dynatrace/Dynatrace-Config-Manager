import * as React from 'react';
import EfficientAccordion from './EfficientAccordion';
import { STATUS_COLORS, STATUS_LABELS } from '../extraction/HorizontalStackedBar';
import TFAnsiText from './TFAnsiText';



export default function TFLogModule({ logModule }) {

    return (
        ((logModule == null || Object.keys(logModule).length === 0)) ? null :
            <React.Fragment>
                {genLogComponents(logModule)}
            </React.Fragment>

    )
}

function genLogComponents(logModule) {

    if (logModule) {
        // pass
    } else {
        return null
    }

    let resourceComponents = []

    for (const resourceLog of Object.values(logModule)) {
        const { module_dir, resource, action_code, module_lines } = resourceLog

        resourceComponents.push(
            <EfficientAccordion
                label={STATUS_LABELS[action_code] + ": " + module_dir + " " + resource}
                labelColor={STATUS_COLORS[action_code]}
                labelVariant="h6"
                defaultExpanded={false}
                componentList={
                    [<TFAnsiText logList={module_lines} />]
                }
            />
        )
    }

    return resourceComponents
}
