import * as React from 'react'
import TreeItem from '@mui/lab/TreeItem/TreeItem'
import { Box, List, ListSubheader, Typography } from '@mui/material'
import ResultDrawerListItem from './ResultDrawerListItem'

export default function ResultDrawerList({ result, contextNode, setContextNode }) {

    const [checked, setChecked] = React.useState([])

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

        let sendEmptyArray = false
        if (newChecked.length >= 1) {
            let currentKey = newChecked[newChecked.length - 1]

            if (toggleOn) {
                currentKey = key
            }

            if (isNumeric(currentKey)) {
                let newColumnArray = [...keyArray]
                newColumnArray[newColumnArray.length - 1] = currentKey

                let newContextNode = {
                    'resultKey': contextNode.resultKey,
                    'rowArray': contextNode.rowArray,
                    'columnArray': newColumnArray,
                    'selectedArray': newChecked,
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
                'selectedArray': [],
            }
            setContextNode(newContextNode)
        }


        setChecked(newChecked)
    }, [checked, contextNode, keyArray, setContextNode])

    const [listItems, listName] = React.useMemo(() => {

        const itemList = topObject[keyArray[keyArray.length - 2]]

        let name = topObject['schemaId']
        name += " ( " + Object.keys(itemList).length + " )"

        const items = []

        for (const [key, child] of Object.entries(itemList)) {
            items.push(
                <ResultDrawerListItem key={key} childKey={key} child={child} handleToggleList={handleToggleList} checked={checked.indexOf(key)} />
            )
        }

        return [items, name]
    }, [handleToggleList, checked, topObject, keyArray])

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

/*
<TreeView
    aria-label="rich object"
    defaultCollapseIcon={<ExpandMoreIcon />}
    defaultExpandIcon={<ChevronRightIcon />}
    defaultSelected={"0"}
    onNodeSelect={(event, selectedNode) => {

        if (isNumeric(selectedNode)) {
            let newColumnArray = [...keyArray]
            newColumnArray[newColumnArray.length - 1] = selectedNode
            let newContextNode = {
                'resultKey': contextNode.resultKey,
                'rowArray': contextNode.rowArray,
                'columnArray': newColumnArray
            }
            setContextNode(newContextNode)
        }
    }}
    sx={{ flexGrow: 1, overflowY: 'auto' }}
>
    {renderTree(richData)}
</TreeView>
*/

const renderTree = (nodes) => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
        {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
);

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}