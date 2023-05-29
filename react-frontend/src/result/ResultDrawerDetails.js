import * as React from 'react';
import { useMemo } from "react"
import { useContextMenuState } from "../context/ContextMenuContext"
import IconButton from '@mui/material/IconButton';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReactJsonViewCompare from 'react-json-view-compare';
import { useResult } from '../context/ResultContext';
import { defaultColumnArray, keyColumns } from '../extraction/ExtractedTable';
import { Box, Grid, Paper, Typography } from '@mui/material';
import TerraformButton from '../terraform/TerraformButton';
import { TERRAFORM_APPLY_TARGET, TERRAFORM_PLAN_TARGET } from '../backend/backend';
import Ansi from "ansi-to-react";
import ResultDrawerList from './ResultDrawerList';

export default function ResultDrawerDetails() {

    const { contextNode, setContextNode } = useContextMenuState()
    const resultKey = useContextResultKey(contextNode)
    const { result } = useResult(resultKey)
    const [actionCompleted, setActionCompleted] = React.useState({})
    const [lastActionId, setLastActionId] = React.useState({})

    const detailsComponent = useMemo(() => {

        if (result) {
            ;
        } else {
            return null
        }

        const [row, __, rowIdx, rowLength] = getObjectFromKeyArray(result, contextNode.rowArray, 0)
        const [column, _, ___, ____] = getObjectFromKeyArray(result, contextNode.columnArray, 0)

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

        /*
        const scrollColumnLeft = () => { scrollColumn(-1) }
        const scrollColumnRight = () => { scrollColumn(1) }
        */

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

        const actionnableStatusMap = {
            'D': 'Delete',
            'U': 'Update',
            'A': 'Add',
            'P': 'Preemptive Add',
        }

        let address = {}

        if (column) {
            if ('data_main' in column && column.data_main) {
                mainObject = JSON.parse(column.data_main)
            }
            if ('data_target' in column && column.data_target) {
                targetObject = JSON.parse(column.data_target)
            }

            const column_copy = { ...column }
            const doWriteMissingTFInfo = (column['status'] in actionnableStatusMap || column['status'] === 'I')
            if (result['address_map'] && result['address_map'][column['monaco_type']] && result['address_map'][column['monaco_type']][column['monaco_id']]) {
                address = result['address_map'][column['monaco_type']][column['monaco_id']]
                column_copy['tf_module'] = address['TrimmedType']
                column_copy['tf_file'] = address['UniqueName'] + '.' + address['TrimmedType'] + '.tf'
            } else {
                if (result['address_map'] && result['address_map'][column['monaco_type']]) {
                    const idMap = result['address_map'][column['monaco_type']]
                    const idMapKeys = Object.keys(idMap)
                    if (idMapKeys.length > 0) {
                        column_copy['tf_module'] = idMap[idMapKeys[0]]['TrimmedType']
                    }
                }
                if ('tf_module' in column_copy) {
                    if (doWriteMissingTFInfo) {
                        column_copy['tf_file'] = "Missing"
                    }
                } else {
                    column_copy['tf_module'] = "Unsupported at the time"
                }

            }
            for (const column_key of ['schemaId', 'key_id', 'status', 'entity_list', 'tf_module', 'tf_file']) {
                if (column_key in column_copy) {

                    const value = column_copy[column_key]

                    if (value === "null" || value === "[]") {
                        continue
                    }

                    let columnLabel = ""
                    columnLabel += column_key
                    columnLabel += ": "
                    columnLabel += value

                    columnLabelList.push(
                        <Typography sx={{ ml: 3 }}>{columnLabel}</Typography>
                    )

                    keyValues[column_key] = value
                }
            }

        }

        let updateObjectList = []

        if ('scope' in keyValues) {
            keyValues['from'] = keyValues['scope']
            keyValues['to'] = keyValues['scope']
        }
        let actionCompletedLabel = ""
        let handleTerraformCallComplete = (data, terraformAction) => { }

        const columnListArray = [...contextNode.columnArray]
        columnListArray.pop()

        const [columnList, _____, _______, ________] = getObjectFromKeyArray(result, columnListArray, 0)

        let nbUpdateError = 0
        let nbUpdate = 0
        let terraformParams = []

        if ('selectedArray' in contextNode) {
            for (const columnKey of Object.values(contextNode['selectedArray'])) {
                const columnUpdate = columnList[columnKey]

                const { monaco_type: monacoTypeUpdate, monaco_id: monacoIdUpdate } = columnUpdate

                if (result && result['address_map'] && result['address_map'][monacoTypeUpdate]) {
                    // pass
                } else {
                    nbUpdateError += 1
                    continue
                }
                const addressUpdate = result['address_map'][monacoTypeUpdate][monacoIdUpdate]
                if (addressUpdate) {
                    // pass
                } else {
                    nbUpdateError += 1
                    continue
                }
                const { Type: TypeUpdate, TrimmedType: TrimmedTypeUpdate, UniqueName: UniqueNameUpdate } = addressUpdate

                if (TypeUpdate && TrimmedTypeUpdate && UniqueNameUpdate) {

                    nbUpdate += 1
                    terraformParams.push({
                        'module': TypeUpdate,
                        'module_trimmed': TrimmedTypeUpdate,
                        'unique_name': UniqueNameUpdate,
                    })


                } else {
                    nbUpdateError += 1
                }
            }

            if (nbUpdate > 0 || nbUpdateError > 0) {
                updateObjectList.push(
                    <Typography sx={{ mt: 1, ml: 2, mb: 1 }}>Terraform action info: </Typography>
                )
            }
            if (nbUpdateError > 0) {
                updateObjectList.push(
                    <Typography sx={{ mt: 1, ml: 2, mb: 1 }}>Warning: {nbUpdateError} configs NOT updatable. </Typography>
                )
            }

            handleTerraformCallComplete = (data, terraformAction, id) => {
                if (data == null) {
                    // pass
                } else {
                    if ('action_id' in data) {
                        // pass
                    } else {
                        return
                    }

                    const id = data['action_id']
                    let newActionCompleted = { ...actionCompleted }

                    if (newActionCompleted['history']) {
                        // pass
                    } else {
                        newActionCompleted['history'] = {}
                    }

                    if (id in newActionCompleted['history']) {
                        // pass
                    } else {
                        newActionCompleted['history'][id] = {}
                    }

                    if (terraformAction in newActionCompleted['history'][id]) {
                        // pass
                    } else {
                        newActionCompleted['history'][id][terraformAction] = {}
                    }

                    if ('aggregate_error' in data) {
                        newActionCompleted['history'][id][terraformAction]['aggregate_error'] = data['aggregate_error']
                    }
                    if ('log_content' in data) {
                        newActionCompleted['history'][id][terraformAction]['log'] = data['log_content']
                    }
                    newActionCompleted['history'][id]['lastTerraformAction'] = terraformAction

                    for (const columnUpdateInfo of Object.values(terraformParams)) {
                        const { module: Type, unique_name: UniqueName } = columnUpdateInfo

                        if (Type in newActionCompleted) {
                            // pass
                        } else {
                            newActionCompleted[Type] = {}
                        }
                        if (UniqueName in newActionCompleted[Type]) {
                            // pass
                        } else {
                            newActionCompleted[Type][UniqueName] = {}
                        }
                        newActionCompleted[Type][UniqueName] = id
                    }

                    setActionCompleted(newActionCompleted)
                }
            }

            let actionId = 0

            const { schemaId } = keyValues
            const { Type, UniqueName } = address
            if (Type && UniqueName && actionCompleted && actionCompleted[Type] && actionCompleted[Type][UniqueName]) {

                actionId = actionCompleted[Type][UniqueName]

            }

            const planActionLabel = "Terraform Plan"
            const applyActionLabel = "Terraform Apply"
            let isPlanDone = false
            let isApplyDone = false

            let actionDetails = []
            if (actionId
                && actionId > 0
                && 'history' in actionCompleted
                && actionId in actionCompleted['history']) {

                const actionInfoObject = actionCompleted['history'][actionId]
                const terraformActionCompletedLabel = actionInfoObject['lastTerraformAction']
                const actionInfo = actionInfoObject[terraformActionCompletedLabel]

                if ('aggregate_error' in actionInfo) {
                    actionDetails.push(
                        <Typography sx={{ ml: 3 }} color="error.light" variant="h5">{terraformActionCompletedLabel + " failed with message: "}</Typography>
                    )
                    actionDetails.push(
                        <Typography sx={{ ml: 3 }} color="error.light" variant="h6">See Terraform Plan Log below for additional info</Typography>
                    )
                    actionDetails.push(
                        <Typography sx={{ ml: 3 }} color="error.light">{actionInfo['aggregate_error']}</Typography>
                    )
                }
                if ('log' in actionInfo) {

                    if (terraformActionCompletedLabel === planActionLabel
                        && actionInfo['log'].includes("Saved the plan to:")) {
                        isPlanDone = true
                    }

                    if (terraformActionCompletedLabel === applyActionLabel
                        && actionInfo['log'].includes("Apply complete!")) {
                        isApplyDone = true
                        actionDetails.push(
                            <Typography sx={{ ml: 3 }} color="success.light" variant="h4">{terraformActionCompletedLabel + " executed!"}</Typography>
                        )
                    }

                    const actionList = [applyActionLabel, planActionLabel]
                    for (const actionLabel of Object.values(actionList)) {
                        if (actionLabel in actionInfoObject) {
                            // pass
                        } else {
                            continue
                        }

                        const localActionInfo = actionInfoObject[actionLabel]

                        actionDetails.push(
                            <Paper sx={{ ml: 3, mt: 2 }}>
                                <Typography color="primary.main" variant="h6">Terraform Log for {actionLabel}, based on action_{actionId}</Typography>
                                {localActionInfo['log'].split("\n").map(function (line) {

                                    return (
                                        <React.Fragment>
                                            <Ansi>{line}</Ansi>
                                            <br />
                                        </React.Fragment>
                                    )
                                })}
                            </Paper>
                        )

                    }

                }

            }

            if (nbUpdate > 0) {
                const handleTerraformCallCompletePlan = (data) => { handleTerraformCallComplete(data, planActionLabel) }
                const getActionId = () => {
                    const newLastActionId = { ...lastActionId }
                    const newActionIdLabel = "newActionId"
                    if (newActionIdLabel in newLastActionId) {
                        // pass
                    } else {
                        newLastActionId[newActionIdLabel] = 0
                    }
                    newLastActionId[newActionIdLabel]++
                    newLastActionId[schemaId] = newLastActionId[newActionIdLabel]

                    setLastActionId(newLastActionId)
                    
                    return newLastActionId[newActionIdLabel]
                }
                updateObjectList.push(
                    <Box sx={{ ml: 2, mb: 1 }}>
                        <TerraformButton terraformAPI={TERRAFORM_PLAN_TARGET} terraformParams={terraformParams}
                            handleChange={handleTerraformCallCompletePlan} getActionId={getActionId}
                            label={"Terraform Plan ( " + nbUpdate + " configs selected, will create a new plan )"} confirm={false} />
                    </Box>
                )
            }
            if (actionId > 0) {
                const handleTerraformCallCompleteApply = (data) => { handleTerraformCallComplete(data, applyActionLabel) }
                const getActionIdApply = () => {
                    return actionId
                }
                updateObjectList.push(
                    <Box sx={{ ml: 2, mb: 1 }}>
                        <TerraformButton terraformAPI={TERRAFORM_APPLY_TARGET} terraformParams={terraformParams}
                            handleChange={handleTerraformCallCompleteApply} getActionId={getActionIdApply}
                            label={"Terraform Apply action_" + actionId + " ( Will apply the plan below, regardless of the current selection )"} confirm={true}
                            disabled={!isPlanDone || isApplyDone} />
                    </Box>
                )
            }

            updateObjectList = updateObjectList.concat(actionDetails)

        }

        const diffViewerFormatted = (
            <React.Fragment>

                <Grid container>

                    <Grid item xs={4}>
                        <IconButton onClick={scrollRowDown} aria-label="delete" size="large" disabled={rowIdx === 1}>
                            <SkipPreviousIcon fontSize="inherit" />
                            <Typography>Previous Row</Typography>
                        </IconButton>
                        <IconButton onClick={scrollRowUp} aria-label="delete" size="large" disabled={rowIdx === rowLength}>
                            <Typography>Next Row</Typography>
                            <SkipNextIcon fontSize="inherit" />
                        </IconButton>
                        <Typography sx={{ ml: 2, mb: 1 }}>Row: {rowIdx} of: {rowLength}</Typography>
                        {rowLabelList}
                        <ResultDrawerList key={"DrawerList" + keyValues['schemaId']} result={result} contextNode={contextNode} setContextNode={setContextNode} />
                    </Grid>

                    <Grid item xs={8}>

                        {updateObjectList}

                        <Typography sx={{ mt: 1, ml: 2, mb: 1 }}>Last Selection Details: </Typography>
                        {columnLabelList}


                        <ReactJsonViewCompare oldData={targetObject} newData={mainObject} />
                    </Grid>
                </Grid>
            </React.Fragment>
        )

        return diffViewerFormatted

    }, [contextNode, result, actionCompleted, lastActionId, setContextNode])

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

        const depthReached = (keyArray.length === (idx + 1))

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