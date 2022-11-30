import * as React from 'react';
import { useMemo } from "react"
import { useContextMenuState } from "../context/ContextMenuContext"
import IconButton from '@mui/material/IconButton';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReactJsonViewCompare from 'react-json-view-compare';
import { useResult } from '../context/ResultContext';
import { defaultColumnArray, keyColumns } from '../extraction/ExtractedTable';
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

        const [row, __, rowIdx, rowLength] = getObjectFromKeyArray(result, contextNode.rowArray, 0)
        const [column, _, columnIdx, columnLength] = getObjectFromKeyArray(result, contextNode.columnArray, 0)

        const scrollColumn = (adjustment) => {

            const [_, newColumnArray, __, ___] = getObjectFromKeyArray(result, contextNode.columnArray, adjustment)

            if (newColumnArray) {
                let newContextNode = {
                    'resultKey': contextNode.resultKey,
                    'rowArray': contextNode.rowArray,
                    'columnArray': newColumnArray
                }
                setContextNode(newContextNode)
            }
        }

        const scrollColumnLeft = () => { scrollColumn(-1) }
        const scrollColumnRight = () => { scrollColumn(1) }

        const scrollRow = (adjustment) => {

            const [_, newRowArray, __, ___] = getObjectFromKeyArray(result, contextNode.rowArray, adjustment)

            if (newRowArray) {
                let newContextNode = {
                    'resultKey': contextNode.resultKey,
                    'rowArray': newRowArray,
                    'columnArray': [...newRowArray, ...defaultColumnArray]
                }
                setContextNode(newContextNode)
            }
        }
        const scrollRowDown = () => { scrollRow(-1) }
        const scrollRowUp = () => { scrollRow(1) }

        let mainObject = {}
        let targetObject = {}
        let rowLabelList = []
        let columnLabelList = []


        if (row) {
            for (const row_key of [...keyColumns, 'status']) {
                if (row_key in row) {

                    let rowLabel = ""
                    rowLabel += row_key
                    rowLabel += ": "
                    rowLabel += row[row_key]

                    rowLabelList.push(
                        <Typography sx={{ ml: 2 }}>{rowLabel}</Typography>
                    )
                }
            }
        }

        if (column) {
            if ('data_main' in column && column.data_main) {
                mainObject = JSON.parse(column.data_main)
            }
            if ('data_target' in column && column.data_target) {
                targetObject = JSON.parse(column.data_target)
            }


            for (const column_key of ['key_id', 'status']) {
                if (column_key in column) {

                    let columnLabel = ""
                    columnLabel += column_key
                    columnLabel += ": "
                    columnLabel += column[column_key]

                    columnLabelList.push(
                        <Typography sx={{ ml: 2 }}>{columnLabel}</Typography>
                    )
                }
            }

        }
        
        const diffViewerFormatted = (
            <React.Fragment>

                <IconButton onClick={scrollRowDown} aria-label="delete" size="large" disabled={rowIdx == 1}>
                    <SkipPreviousIcon fontSize="inherit" />
                    <Typography>Previous Row</Typography>
                </IconButton>
                <IconButton onClick={scrollRowUp} aria-label="delete" size="large" disabled={rowIdx == rowLength}>
                    <Typography>Next Row</Typography>
                    <SkipNextIcon fontSize="inherit" />
                </IconButton>
                <Typography sx={{ ml: 2 }}>Row: {rowIdx} of: {rowLength}</Typography>
                {rowLabelList}

                <IconButton onClick={scrollColumnLeft} aria-label="delete" size="large" disabled={columnIdx == 1}>
                    <SkipPreviousIcon fontSize="inherit" />
                    <Typography>Previous Column</Typography>
                </IconButton>
                <IconButton onClick={scrollColumnRight} aria-label="delete" size="large" disabled={columnIdx == columnLength}>
                    <Typography>Next Column</Typography>
                    <SkipNextIcon fontSize="inherit" />
                </IconButton>
                <Typography sx={{ ml: 2 }}>Column: {columnIdx} of: {columnLength}</Typography>
                {columnLabelList}
                
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

            let adjustedIdx = keyList.indexOf(key)

            if(adjustedIdx < 0) {
                adjustedIdx = 0
            }

            adjustedIdx += adjustment

            key = keyList[adjustedIdx]

            let newKeyArray = [...keyArray]
            newKeyArray[idx] = key

            const foundValue = sourceObject[key]

            if (foundValue) {
                return [foundValue, newKeyArray, (adjustedIdx + 1), keyList.length]
            } else {
                return [null, null, 0, 0]
            }
        } else {
            return getObjectFromKeyArray(sourceObject[keyArray[idx]], keyArray, adjustment, (idx + 1))
        }

    } else {
        return [null, null, 0, 0]
    }
}