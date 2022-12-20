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