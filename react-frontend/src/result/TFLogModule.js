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
