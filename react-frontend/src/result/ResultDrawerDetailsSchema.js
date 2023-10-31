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
import { useMemo } from "react"
import IconButton from '@mui/material/IconButton';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { defaultColumnArray } from '../extraction/ExtractedTable';
import { Grid, Paper, Typography } from '@mui/material';
import { PLAN_ALL_RESOURCE_DIFF, TERRAFORM_APPLY_TARGET, TERRAFORM_PLAN_TARGET, backendGet } from '../backend/backend';
import ResultDrawerList from './ResultDrawerList';
import EfficientAccordion from './EfficientAccordion';
import TFAnsiText from './TFAnsiText';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { STATUS_COLORS, STATUS_LABELS, STATUS_PREFIX } from '../extraction/HorizontalStackedBar';
import { useHistoryState } from '../context/HistoryContext';

const keyColumns = [
    'scope',
    'from',
    'to',
    'module'
]

export default function ResultDrawerDetailsSchema({ contextNode, setContextNode, result, genTerraformActionComponent }) {

    const [logList, setLogList] = React.useState([])
    const { lastActionId, setLastActionId } = useHistoryState()

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const [drawerList, resourceInfo, columnLabelList, module, uniqueName, key_id, status] = useMemo(() => {

        const [row, , rowIdx, rowLength] = getObjectFromKeyArray(result, contextNode.rowArray, 0)
        const [column, , ,] = getObjectFromKeyArray(result, contextNode.columnArray, 0)

        const scrollRow = (adjustment) => {

            const [, newRowArray, ,] = getObjectFromKeyArray(result, contextNode.rowArray, adjustment)

            if (newRowArray) {
                let newContextNode = {
                    'resultKey': contextNode.resultKey,
                    'rowArray': newRowArray,
                    'columnArray': [...newRowArray, ...defaultColumnArray],
                    'searchText': contextNode.searchText,
                }
                setContextNode(newContextNode)
            }
        }
        const scrollRowDown = () => { scrollRow(-1) }
        const scrollRowUp = () => { scrollRow(1) }

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
                        <Typography key={`row-${row_key}`} sx={{ ml: 3 }}>{rowLabel}</Typography>
                    )
                    keyValues[row_key] = row[row_key]
                }
            }
        }

        const { module } = row
        const { status, key_id } = column
        const color = STATUS_COLORS[status]

        if (column) {
            const column_copy = { ...column }
            const columnParam = {
                'module': null,
                'key_id': null,
                'status': (status) => {
                    if (status in STATUS_LABELS) {
                        return STATUS_LABELS[status]

                    } else {
                        return status
                    }
                },
                'entity_list': null,
                'module_dir ': null,
            }

            for (const [column_key, columnFunction] of Object.entries(columnParam)) {
                if (column_key in column_copy) {

                    let value = column_copy[column_key]

                    if (value === "null" || value === "[]") {
                        continue
                    }

                    if (columnFunction) {
                        value = columnFunction(value)
                    }


                    let columnLabel = ""
                    columnLabel += column_key
                    columnLabel += ": "
                    columnLabel += value

                    columnLabelList.push(
                        <Typography key={`columnLabelList-${columnLabelList.length}`} sx={{ ml: 3 }} color={color}>{columnLabel}</Typography>
                    )

                    keyValues[column_key] = value
                }
            }

        }

        let updateHeaderComponentList = []

        if ('scope' in keyValues) {
            keyValues['from'] = keyValues['scope']
            keyValues['to'] = keyValues['scope']
        }

        const columnListArray = [...contextNode.columnArray]
        columnListArray.pop()

        const [columnList, , ,] = getObjectFromKeyArray(result, columnListArray, 0)

        let nbUpdateError = 0
        let nbUpdate = 0
        let terraformParams = []
        let updateComponent = null
        const { key_id: uniqueName } = column

        if ('selectedArray' in contextNode) {
            for (const columnKey of Object.values(contextNode['selectedArray'])) {
                const columnUpdate = columnList[columnKey]

                if (columnUpdate) {
                    // pass
                } else {
                    continue
                }
                const { module: moduleUpdate } = row
                const { key_id: uniqueNameUpdate } = columnUpdate
                const { module_dir: moduleDirUpdate } = columnUpdate

                let moduleDir = moduleUpdate
                if (moduleDirUpdate && moduleDirUpdate !== "") {
                    moduleDir = moduleDirUpdate
                }

                if (moduleUpdate && uniqueNameUpdate) {

                    nbUpdate += 1
                    terraformParams.push({
                        'module': "dynatrace_" + moduleUpdate,
                        'module_trimmed': moduleDir,
                        'unique_name': uniqueNameUpdate,
                    })


                } else {
                    nbUpdateError += 1
                }
            }

            if (nbUpdateError > 0) {
                updateHeaderComponentList.push(
                    <Typography sx={{ mt: 1, ml: 2, mb: 1 }}>Warning: {nbUpdateError} configs NOT updatable. </Typography>
                )
            }

            updateComponent = genTerraformActionComponent(lastActionId, setLastActionId, nbUpdate, terraformParams, module, uniqueName, nbUpdateError, TERRAFORM_PLAN_TARGET, TERRAFORM_APPLY_TARGET);
        }

        const drawerList = (
            <React.Fragment>
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
                <ResultDrawerList key={"DrawerList" + keyValues['module'] + contextNode.searchText} result={result} contextNode={contextNode} setContextNode={setContextNode} />
            </React.Fragment>
        )

        const resourceInfo = (
            <React.Fragment>
                {updateHeaderComponentList}
                {updateComponent}
            </React.Fragment>
        )

        return [drawerList, resourceInfo, columnLabelList, module, uniqueName, key_id, status]

    }, [contextNode, result, setContextNode, genTerraformActionComponent, lastActionId, setLastActionId])

    React.useEffect(() => {

        const searchParams = { 'tenant_key_main': tenantKeyMain, 'tenant_key_target': tenantKeyTarget, 'module': module, 'unique_name': uniqueName }

        const thenFunction = promise =>
            promise
                .then(response => {
                    return response.json()
                })
                .then(data => {
                    const { lines } = data
                    if (lines) {
                        setLogList(lines)
                    } else {
                        setLogList([])
                    }
                })

        setLogList([])
        backendGet(PLAN_ALL_RESOURCE_DIFF, searchParams, thenFunction, undefined, false)

    }, [tenantKeyMain, tenantKeyTarget, module, uniqueName, setLogList])

    return (
        <React.Fragment>

            <Grid container>

                <Grid item xs={4}>
                    {drawerList}
                </Grid>

                <Grid item xs={8}>
                    {resourceInfo}

                    <Paper sx={{ ml: 1, mt: 2 }}>
                        <EfficientAccordion
                            defaultExpanded={true}
                            label={"Last Selection Details: " + STATUS_PREFIX[status] + " " + key_id}
                            labelColor={STATUS_COLORS[status]}
                            componentList={
                                [
                                    columnLabelList,
                                    <Typography key={`lastSelectionCachedTextLabel`} sx={{ ml: 3, mt: 2 }}>Cached terraform plan info: </Typography>,
                                    <Paper key={`lastSelectionCachedTextAnsi`} sx={{ ml: 3, p: 1.5 }}>
                                        <TFAnsiText key="cachedText" logList={logList} />
                                    </Paper>
                                ]
                            }
                        />
                    </Paper>

                </Grid>
            </Grid>
        </React.Fragment>
    )
}

export const getObjectFromKeyArray = (sourceObject, keyArray, adjustment, idx = 0) => {

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