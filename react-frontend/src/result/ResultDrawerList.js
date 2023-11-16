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

import * as React from 'react'
import { Box, Button, Typography } from '@mui/material'
import ResultDrawerListItem from './ResultDrawerListItem'
import { STATUS_ORDER } from '../extraction/HorizontalStackedBar'
import ResultDrawerListSchema from './ResultDrawerListSchema'

export const UNCHECK_ALL = "UNCHECK_ALL"
export const UNCHECK_ALL_A = `${UNCHECK_ALL}_A`
export const UNCHECK_ALL_B = `${UNCHECK_ALL}_B`

export default function ResultDrawerList({ result, contextNode, setContextNode }) {

    const [checked, setChecked] = React.useState([])
    const [checkAllStatus, setCheckAllStatus] = React.useState("")
    const [currentKey, setCurrentKey] = React.useState("")

    const keyArray = React.useMemo(() => {
        return contextNode.columnArray
    }, [contextNode])

    const topObject = React.useMemo(() => {
        let idx = 0
        let curObject = result
        while (idx < (keyArray.length - 2)) {
            curObject = curObject[keyArray[idx]]
            idx++
        }
        return curObject

    }, [result, keyArray])

    const handleToggleList = React.useCallback((key, toggleOn) => {
        const currentIndex = checked.indexOf(key)
        const currentlyOn = currentIndex !== -1
        const newChecked = [...checked]

        if (toggleOn) {
            if (currentlyOn) {
                ;
            } else {
                newChecked.push(key)
            }
        } else {
            if (currentlyOn) {
                newChecked.splice(currentIndex, 1)
            }
        }

        if (toggleOn) {
            setCurrentKey(key)
        }

        setChecked(newChecked)
    }, [checked, setChecked])

    const handleSetCheckAllStatus = React.useCallback((status, keys) => {
        if (status === checkAllStatus) {
            setCheckAllStatus("")
            setChecked([])
        } else {
            setCheckAllStatus(status)
            setChecked(keys)
        }
    }, [checkAllStatus, setCheckAllStatus, setChecked])

    const handleUnCheckAll = React.useCallback(() => {
        let statusToSet = UNCHECK_ALL_A
        if (checkAllStatus === UNCHECK_ALL_A) {
            statusToSet = UNCHECK_ALL_B
        }
        setCheckAllStatus(statusToSet)
        setChecked([])
    }, [setCheckAllStatus, setChecked, checkAllStatus])

    React.useMemo(() => {
        let sendEmptyArray = false
        if (checked.length >= 1) {
            let key = checked[checked.length - 1]

            if (isNumeric(currentKey) && checked.includes(currentKey)) {
                key = currentKey
            }

            if (isNumeric(key)) {
                let newColumnArray = [...keyArray]
                newColumnArray[newColumnArray.length - 1] = key

                let newContextNode = {
                    'resultKey': contextNode.resultKey,
                    'rowArray': contextNode.rowArray,
                    'columnArray': newColumnArray,
                    'searchText': contextNode.searchText,
                    'selectedArray': checked,
                }
                setContextNode(newContextNode)
            } else {
                sendEmptyArray = true
            }
        } else {
            sendEmptyArray = true
        }

        if (sendEmptyArray) {

            let newContextNode = {
                'resultKey': contextNode.resultKey,
                'rowArray': contextNode.rowArray,
                'columnArray': contextNode.columnArray,
                'searchText': contextNode.searchText,
                'selectedArray': [],
            }
            setContextNode(newContextNode)
        }
    }, [checked, currentKey])

    const [listItems, listName] = React.useMemo(() => {

        const itemList = topObject[keyArray[keyArray.length - 2]]

        const items = {}
        let nbFound = 0
        let schemaFound = (contextNode.searchText === ""
            || topObject['module'].toLowerCase().includes(contextNode.searchText))


        for (const [key, child] of Object.entries(itemList)) {
            const { key_id, entity_list, status } = child

            if (status) {
                if (status in items) {
                    // pass
                } else {

                    items[status] = { "nbMax": 0, "list": [], "keys": [] }
                }
                items[status]["nbMax"]++
            } else {
                console.log("ERROR: Resource without status: ", child)
                continue
            }

            if (schemaFound
                || (key_id && key_id.toLowerCase().includes(contextNode.searchText))
                || (entity_list && entity_list.toLowerCase().includes(contextNode.searchText))) {
                nbFound++

                const forceCheckStatus = status === checkAllStatus
                const forceUncheckAll = checkAllStatus.startsWith(UNCHECK_ALL)
                const forceUncheckStatus = (status !== checkAllStatus && checkAllStatus !== "" && !forceUncheckAll)
                const forceUncheck = forceUncheckStatus || forceUncheckAll
                const disabled = forceUncheckStatus || forceCheckStatus

                let forceUncheckValue = ""
                if(forceUncheck) {
                    forceUncheckValue = checkAllStatus
                }

                items[status]["list"].push(
                    <ResultDrawerListItem key={key} childKey={key} child={child}
                        handleToggleList={handleToggleList} checked={checked.indexOf(key)}
                        forceCheck={forceCheckStatus}
                        forceUncheckValue={forceUncheckValue}
                        disabled={disabled}
                        allChecked={checked} />
                )

                items[status]["keys"].push(key)

            }
        }

        const nbMax = Object.keys(itemList).length
        let name = GetNumberedLabel(topObject['module'], nbFound, nbMax)

        const componentList = []
        let label_suffix = ""
        if(checked && checked.length > 0) {
            label_suffix = `(${checked.length} configs selected)`
        }

        componentList.push(

            <Button sx={{ mt: 1 }} key="UncheckAll Button"
                onClick={() => { handleUnCheckAll() }}
            > Uncheck All Configs {label_suffix}</Button >
        )

        const addStatusComponent = (status) => {

            const resourceComponent = items[status]
            if (resourceComponent) {
                // pass
            } else {
                return
            }

            const { nbMax, list, keys } = resourceComponent
            const props = { status, list, nbMax, keys, checkAllStatus, handleSetCheckAllStatus }
            componentList.push(
                <ResultDrawerListSchema key={`drawerListSchema-${name}-${status}`} {...props} />
            )
        }

        for (const status of STATUS_ORDER) {
            addStatusComponent(status)
        }

        for (const status of Object.keys(items)) {
            if (STATUS_ORDER.includes(status)) {
                continue;
            }
            addStatusComponent(status)
        }

        return [componentList, name]
    }, [handleToggleList, checked, topObject, keyArray, contextNode, checkAllStatus, handleSetCheckAllStatus, handleUnCheckAll])

    const treeViewComponent = React.useMemo(() => {
        return (
            <Box
                sx={{
                    mt: 2,
                    ml: 2,
                    height: 750,
                    overflowX: 'auto',
                    overflowY: "auto",
                }}
            >
                <Typography>{listName}</Typography>
                <Box
                    sx={{
                        height: 700,
                        overflowX: 'auto',
                        overflowY: "auto",
                    }}
                >
                    {listItems}
                </Box>
            </Box >
        )
    }, [listItems, listName])


    return treeViewComponent
}

export function GetNumberedLabel(label, nbFound, nbMax) {
    let name = label

    if (nbFound === nbMax) {
        name += " ( " + nbMax + " )"
    } else {
        name += " ( " + nbFound + "/" + nbMax + " )"
    }
    return name
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}