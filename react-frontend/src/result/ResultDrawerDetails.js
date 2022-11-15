import * as React from 'react';
import { useMemo } from "react"
import { useContextMenuState } from "../context/ContextMenuContext"
import IconButton from '@mui/material/IconButton';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReactJsonViewCompare from 'react-json-view-compare';
import { useResult } from '../context/ResultContext';
import { keyColumns } from '../extraction/ExtractedTable';
import { Typography } from '@mui/material';

export default function ResultDrawerDetails() {

    const { contextNode, setContextNode } = useContextMenuState()
    const resultKey = useContextResultKey(contextNode)
    const { result } = useResult(resultKey)

    const detailsComponent = useMemo(() => {

        if (result) {
            ;
        } else {
            return null
        }

        const [node, _] = getObjectFromKeyArray(result, contextNode.keyArray, 0)

        const scrollList = (adjustment) => {

            const [_, newKeyArray] = getObjectFromKeyArray(result, contextNode.keyArray, adjustment)

            if (newKeyArray) {
                let newContextNode = {
                    'resultKey': contextNode.resultKey,
                    'keyArray': newKeyArray
                }
                setContextNode(newContextNode)
            }
        }

        const scrollDown = () => { scrollList(-1) }
        const scrollUp = () => { scrollList(1) }

        let mainObject = {}
        let targetObject = {}
        let nodeLabelList = []

        if (node) {
            if ('data_main' in node && node.data_main) {
                mainObject = JSON.parse(node.data_main)
            }
            if ('data_target' in node && node.data_target) {
                targetObject = JSON.parse(node.data_target)
            }

            for (const column_key of [...keyColumns, 'status']) {
                if (column_key in node) {

                    let nodeLabel = ""
                    nodeLabel += column_key
                    nodeLabel += ": "
                    nodeLabel += node[column_key]

                    nodeLabelList.push(
                        <Typography sx={{ ml: 2 }}>{nodeLabel}</Typography>
                    )
                }
            }
        }

        const diffViewerFormatted = (
            <React.Fragment>
                <IconButton onClick={scrollDown} aria-label="delete" size="large">
                    <SkipPreviousIcon fontSize="inherit" />
                    <Typography>Previous Row</Typography>
                </IconButton>
                <IconButton onClick={scrollUp} aria-label="delete" size="large">
                    <Typography>Next Row</Typography>
                    <SkipNextIcon fontSize="inherit" />
                </IconButton>
                {nodeLabelList}
                <ReactJsonViewCompare oldData={targetObject} newData={mainObject} />
            </React.Fragment>
        )

        return diffViewerFormatted

    }, [contextNode, resultKey, result])

    return (
        detailsComponent
    )
}

function useContextResultKey(contextNode) {
    return useMemo(() => {
        if (contextNode) {
            return contextNode['resultKey']
        }
        return null
    }, [contextNode])

}

const getObjectFromKeyArray = (sourceObject, keyArray, adjustment, idx = 0) => {

    if (sourceObject && keyArray && keyArray.length && idx < keyArray.length && keyArray[idx]) {

        const depthReached = (keyArray.length == (idx + 1))

        if (depthReached) {
            let key = keyArray[idx]
            const keyList = Object.keys(sourceObject)

            const adjustedIdx = keyList.indexOf(key) + adjustment
            key = keyList[adjustedIdx]

            let newKeyArray = [...keyArray]
            newKeyArray[idx] = key

            const foundValue = sourceObject[key]

            if (foundValue) {
                return [foundValue, newKeyArray]
            } else {
                return [null, null]
            }
        } else {
            return getObjectFromKeyArray(sourceObject[keyArray[idx]], keyArray, adjustment, (idx + 1))
        }

    } else {
        return [null, null]
    }
}