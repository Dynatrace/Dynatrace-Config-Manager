import * as React from 'react'
import { Box, Typography } from '@mui/material'
import ResultDrawerListItem from './ResultDrawerListItem'
import { STATUS_ORDER } from '../extraction/HorizontalStackedBar'
import ResultDrawerListSchema from './ResultDrawerListSchema'

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
        } else {
            setCheckAllStatus(status)
            setChecked(keys)
        }
    }, [checkAllStatus, setCheckAllStatus])

    React.useMemo(() => {
        let sendEmptyArray = false
        if (checked.length >= 1) {
            let key = checked[checked.length - 1]

            if(isNumeric(currentKey) && checked.includes(currentKey)) {
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

                items[status]["list"].push(
                    <ResultDrawerListItem key={key} childKey={key} child={child}
                        handleToggleList={handleToggleList} checked={checked.indexOf(key)}
                        forceCheck={status === checkAllStatus}
                        forceUncheck={status !== checkAllStatus && checkAllStatus !== ""} />
                )

                items[status]["keys"].push(key)

            }
        }

        const nbMax = Object.keys(itemList).length
        let name = GetNumberedLabel(topObject['module'], nbFound, nbMax)

        const componentList = []

        for (const status of STATUS_ORDER) {
            const resourceComponent = items[status]
            if (resourceComponent) {
                // pass
            } else {
                continue
            }

            const { nbMax, list, keys } = resourceComponent
            const props = { status, list, nbMax, keys, checkAllStatus, handleSetCheckAllStatus }
            componentList.push(
                <ResultDrawerListSchema {...props} />
            )

        }

        return [componentList, name]
    }, [handleToggleList, checked, topObject, keyArray, contextNode, checkAllStatus, handleSetCheckAllStatus])

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