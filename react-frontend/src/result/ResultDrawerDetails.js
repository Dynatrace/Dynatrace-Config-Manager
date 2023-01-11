import * as React from 'react';
import { useMemo } from "react"
import { useContextMenuState } from "../context/ContextMenuContext"
import IconButton from '@mui/material/IconButton';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReactJsonViewCompare from 'react-json-view-compare';
import { useResult } from '../context/ResultContext';
import { defaultColumnArray, keyColumns } from '../extraction/ExtractedTable';
import { Box, Typography } from '@mui/material';
import { getDefaultEntityFilter } from '../context/EntityFilterContext';
import MigrateButtonControlled from '../migrate/MigrateButtonControlled';

export default function ResultDrawerDetails() {

    const { contextNode, setContextNode } = useContextMenuState()
    const resultKey = useContextResultKey(contextNode)
    const { result } = useResult(resultKey)
    const [actionCompleted, setActionCompleted] = React.useState({})

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
        let keyValues = {}


        if (row) {
            for (const row_key of [...keyColumns, 'status']) {
                if (row_key in row) {

                    let rowLabel = ""
                    rowLabel += row_key
                    rowLabel += ": "
                    rowLabel += row[row_key]

                    rowLabelList.push(
                        <Typography sx={{ ml: 3 }}>{rowLabel}</Typography>
                    )
                    keyValues[row_key] = row[row_key]
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


            for (const column_key of ['schemaId', 'key_id', 'status']) {
                if (column_key in column) {

                    let columnLabel = ""
                    columnLabel += column_key
                    columnLabel += ": "
                    columnLabel += column[column_key]

                    columnLabelList.push(
                        <Typography sx={{ ml: 3 }}>{columnLabel}</Typography>
                    )

                    keyValues[column_key] = column[column_key]
                }
            }

        }

        let updateObjectList = []

        if ('scope' in keyValues) {
            keyValues['from'] = keyValues['scope']
            keyValues['to'] = keyValues['scope']
        }

        const actionnableStatusMap = {
            'D': 'Delete',
            'U': 'Update',
            'A': 'Add',
        }

        let isActionCompleted = false
        let actionCompletedLabel = ""
        let disableButtonAfterCompletion = () => { }

        if ('status' in keyValues) {

            if (keyValues['status'] in actionnableStatusMap
                && 'from' in keyValues
                && 'to' in keyValues
                && 'schemaId' in keyValues) {

                const { from, to, schemaId } = keyValues
                let keyId = null
                const statusLabel = actionnableStatusMap[keyValues['status']]

                let entityFilter = getDefaultEntityFilter()
                entityFilter['forcedMatchChecked'] = true
                entityFilter['forcedMatchEntityChecked'] = true
                entityFilter['forcedMatchMain'] = from
                entityFilter['forcedMatchTarget'] = to
                entityFilter['forcedMatchSchemaIdChecked'] = true
                entityFilter['forcedMatchSchemaId'] = schemaId
                entityFilter['useEnvironmentCache'] = true
                if ('key_id' in keyValues) {
                    entityFilter['forcedMatchKeyIdChecked'] = true
                    keyId = keyValues['key_id']
                    entityFilter['forcedMatchKeyId'] = keyId
                }
                entityFilter['applyMigrationChecked'] = true
                entityFilter['preemptiveConfigCopy'] = statusLabel === "Preemptive"

                entityFilter['forcedKeepActionChecked'] = true
                entityFilter.forcedKeepAddChecked = statusLabel === "Add"
                entityFilter.forcedKeepDeleteChecked = statusLabel === "Delete"
                entityFilter.forcedKeepUpdateChecked = statusLabel === "Update"
                entityFilter.forcedKeepIdenticalChecked = statusLabel === "Identical"
                entityFilter.forcedKeepPreemptiveChecked = statusLabel === "Preemptive"

                let tempKeyId = keyId
                if (keyId == null) {
                    tempKeyId = ""
                }


                disableButtonAfterCompletion = (data) => {
                    if (data == null) {
                        ;
                    } else {
                        ;
                        let newActionCompleted = { ...actionCompleted }
                        if (from in newActionCompleted) {
                            ;
                        } else {
                            newActionCompleted[from] = {}
                        }
                        if (to in newActionCompleted[from]) {
                            ;
                        } else {
                            newActionCompleted[from][to] = {}
                        }
                        if (schemaId in newActionCompleted[from][to]) {
                            ;
                        } else {
                            newActionCompleted[from][to][schemaId] = {}
                        }
                        if (tempKeyId in newActionCompleted[from][to][schemaId]) {
                            ;
                        } else {
                            newActionCompleted[from][to][schemaId][tempKeyId] = {}
                        }
                        let newActionCOmpleted = true
                        newActionCompleted[from][to][schemaId][tempKeyId]['action'] = statusLabel
                        if ('aggregate_error' in data) {
                            newActionCOmpleted = false
                            newActionCompleted[from][to][schemaId][tempKeyId]['aggregate_error'] = data['aggregate_error']
                        }
                        newActionCompleted[from][to][schemaId][tempKeyId]['isActionCompleted'] = newActionCOmpleted
                        setActionCompleted(newActionCompleted)
                    }
                }

                if (from in actionCompleted
                    && to in actionCompleted[from]
                    && schemaId in actionCompleted[from][to]
                    && tempKeyId in actionCompleted[from][to][schemaId]) {

                    isActionCompleted = actionCompleted[from][to][schemaId][tempKeyId]['isActionCompleted']
                    actionCompletedLabel = actionCompleted[from][to][schemaId][tempKeyId]['action']

                    if ('aggregate_error' in actionCompleted[from][to][schemaId][tempKeyId]) {
                        updateObjectList.push(
                            <Typography sx={{ ml: 3 }} color="error.light" variant="h5">{actionCompletedLabel + " failed with message: "}</Typography>
                        )
                        updateObjectList.push(
                            <Typography sx={{ ml: 3 }} color="error.light">{actionCompleted[from][to][schemaId][tempKeyId]['aggregate_error']}</Typography>
                        )
                    } else {
                        updateObjectList.push(
                            <Typography sx={{ ml: 3 }} color="success.light" variant="h4">{actionCompletedLabel + " executed!"}</Typography>
                        )
                    }

                }

                updateObjectList.push(
                    <Box sx={{ ml: 2, mb: 1 }}>
                        <MigrateButtonControlled entityFilter={entityFilter} handleChange={disableButtonAfterCompletion}
                            label={statusLabel + " This Object"} confirm={true}
                            disabled={isActionCompleted} />
                    </Box>
                )
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
                <Typography sx={{ ml: 2, mb: 1 }}>Row: {rowIdx} of: {rowLength}</Typography>
                {rowLabelList}

                <IconButton onClick={scrollColumnLeft} aria-label="delete" size="large" disabled={columnIdx == 1}>
                    <SkipPreviousIcon fontSize="inherit" />
                    <Typography>Previous Column</Typography>
                </IconButton>
                <IconButton onClick={scrollColumnRight} aria-label="delete" size="large" disabled={columnIdx == columnLength}>
                    <Typography>Next Column</Typography>
                    <SkipNextIcon fontSize="inherit" />
                </IconButton>
                <Typography sx={{ ml: 2, mb: 1 }}>Column: {columnIdx} of: {columnLength}</Typography>
                {columnLabelList}

                {updateObjectList}

                <ReactJsonViewCompare oldData={targetObject} newData={mainObject} />
            </React.Fragment>
        )

        return diffViewerFormatted

    }, [contextNode, resultKey, result, actionCompleted])

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

            if (adjustedIdx < 0) {
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