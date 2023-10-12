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

import { useMemo } from "react"

export const useFilterOnLabel = (entityFilter) => {

    const label = useMemo(() => {
        return genEntityFilterEnhancedLabel(entityFilter)

    }, [entityFilter])

    return label

}

export const genEntityFilterEnhancedLabel = (entityFilter) => {
    let label = ""
    let isFirstConcat = true

    const concatList = [
        {
            'enabled': entityFilter.dateRangeChecked,
            'label': "Date Range"
        },
        {
            'enabled': entityFilter.forcedMatchEntityIdChecked,
            'label': "Entity Id"
        },
        {
            'enabled': entityFilter.forcedMatchSchemaIdChecked,
            'label': "Schema Id"
        },
        {
            'enabled': entityFilter.forcedMatchKeyIdChecked,
            'label': "Key Id"
        },
        {
            'enabled': entityFilter.forcedKeepActionChecked,
            'label': "Actions"
        },
        {
            'enabled': entityFilter.forcedMatchChecked,
            'label': "Forced Entity Match"
        },
    ]

    for (const concat of concatList) {
        if (concat['enabled']) {
            if (isFirstConcat) {
                label += "Filtering on "
                isFirstConcat = false
            } else {
                label += ","
            }
            label += " "
            label += concat['label']
        }
    }

    if (isFirstConcat) {
        label = "Not Filtering"
    }

    return getEntityFilterLabel(entityFilter) + " ( " + label + " )"
}

export const getEntityFilterLabel = (entityFilter) => {
    let label = entityFilter.label
    if (!label || label === "") {
        label = "New Entity Filter"
    }
    return label
}