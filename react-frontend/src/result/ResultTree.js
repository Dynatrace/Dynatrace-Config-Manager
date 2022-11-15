import * as React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TreeView from '@mui/lab/TreeView'
import SortOrderOption from '../options/SortOrderOption'
import { Box, FormControl } from '@mui/material'
import { useDebouncedTextField } from '../text/DebouncedInputHook'
import { useResultTree } from './ResultTreeHook'
import { useResultItemMenu } from './ResultItemMenuHook'

export default function ResultTree({ data, defaultSortOrder, initialFilterText, setOpenDrawer, containsEntrypoint=false }) {

    const { text: searchText, debouncedTextField } = useDebouncedTextField(initialFilterText)
    const [sortOrder, setSortOrder] = React.useState(defaultSortOrder)
    const { handleContextMenu } = useResultItemMenu(setOpenDrawer, data)
    const { renderedTreeItems, expandedList } = useResultTree(data, sortOrder, searchText, handleContextMenu, containsEntrypoint)
    const [expanded, setExpanded] = React.useState([])

    React.useEffect(() => {
        setExpanded(expandedList)
    }, [expandedList])

    const treeViewComponent = React.useMemo(() => {

        const onNodeToggle = (event, nodeIds) => {
            setExpanded(nodeIds)
        }

        return (
            <TreeView
                aria-label="rich object"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                expanded={expanded}
                onNodeToggle={onNodeToggle}
                sx={{ flexGrow: 1, overflowY: 'auto' }}
            >
                {renderedTreeItems}
            </TreeView>
        )
    }, [renderedTreeItems, expanded, setExpanded])

    const resultTreeComponent = React.useMemo(() => {

        return (
            <Box sx={{ ml: 2 }}>
                <SortOrderOption {...{ sortOrder, setSortOrder }} />
                <FormControl fullWidth>
                    {debouncedTextField}
                </FormControl>
                {treeViewComponent}
            </Box>
            )
        
    }, [sortOrder, setSortOrder, debouncedTextField, treeViewComponent])

    return resultTreeComponent
}