import { Typography } from "@mui/material"
import { useMemo } from "react"
import { useContextMenuStateValue } from "../context/ContextMenuContext"

const depthIndent = 2
const paragraphMargin = 1

export default function ResultDrawerDetails() {
    const { contextNode: node } = useContextMenuStateValue()

    const detailsComponent = useMemo(() => {
        let list = []
        let depth = 1
        if (node) {
            const extractionMap = {
                "name": "Name",
                "entity_type": "Type",
                "entity_id": "ID",
                "total_traces": "Total Traces",
                "total_frames": "Total Frames",
            }
            for (const [key, value] of Object.entries(extractionMap)) {
                if (node[key]) {
                    list = addParagraph(list, key, depth, node[key], value)
                }
            }

            list = addNumericMap(list, node.samples, "samples", depth, "Number of samples (per thread state): ")
            list = addNumericMap(list, node.original_samples, "original_samples", depth, "Out of: ")

            list = addEntrypointMap(list, node, depth)
        }
        return list
    }, [node])

    return (
        detailsComponent
    )
}

const addNumericMap = (list, samples, sectionKey, depth, title) => {
    if (samples) {
        let hasOneGTZero = false
        list = addParagraph(list, (sectionKey + "title"), depth, title)
        depth += 1
        for (const [key, value] of Object.entries(samples)) {
            if (value > 0) {
                hasOneGTZero = true
                list = addLine(list, (sectionKey + key), depth, value, key)
            }
        }
        if (hasOneGTZero) {
            ;
        } else {
            list = addLine(list, (sectionKey + "zero"), depth, "All filtered out")
        }
    }
    return list
}

const addEntrypointMap = (list, node, depth) => {
    let sectionKey = "Entrypoint"
    let sectionId = 0
    const entrypoint = node.entrypoint

    if (entrypoint) {
        const entrypointInfo = entrypoint[0][0]
        sectionId += 1
        list = addParagraph(list, (sectionKey + sectionId + "title"), depth, "Entrypoint Info: ")
        const extractionMap = {
            "technology": "Language",
            "api_name": "API Name",
            "clazz": "Class Name",
            "method": "Method",
        }
        depth += 1
        for (const [key, value] of Object.entries(extractionMap)) {
            if (entrypointInfo[key]) {
                sectionId += 1
                list = addLine(list, (sectionKey + sectionId + key), depth, entrypointInfo[key], value)
            }
        }
        depth -= 1

        sectionId += 1
        list = addParagraph(list, (sectionKey + sectionId + "title"), depth, "Where this Entrypoint has been seen: ")
        for (const tenantUI of Object.values(entrypoint)) {
            sectionId += 1
            depth += 1
            list = addParagraph(list, (sectionKey + sectionId + "tenant"), depth, tenantUI[0]['tenant'], "Tenant")
            for (const entry of Object.values(tenantUI)) {
                sectionId += 1
                depth += 1
                list = addParagraph(list, (sectionKey + sectionId + "empty"), depth, " ")
                for (const [key, value] of Object.entries(entry)) {
                    if (key in extractionMap || key === 'tenant') {
                        ;
                    } else {
                        sectionId += 1
                        list = addLine(list, (sectionKey + sectionId + key), depth, value, key)
                    }
                }
                depth -= 1
            }
            depth -= 1
        }
    }
    return list
}

const addParagraph = (list, reactKey, depth, value, key=undefined) => {
    return addLine(list, reactKey, depth, value, key, true)
}

const addLine = (list, reactKey, depth, value, key=undefined, isParagraph=false) => {
    let topMargin = 0
    if(isParagraph) {
        topMargin = paragraphMargin
    }
    let text = undefined
    if(key) {
        text = (key + ": " + value)
    } else {
        text = value
    }
    list.push(<Typography key={reactKey} sx={{ mt: topMargin, ml: (depth * depthIndent) }}>{text}</Typography>)

    return list
}