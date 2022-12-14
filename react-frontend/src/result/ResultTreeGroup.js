import * as React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SortOrderOption from '../options/SortOrderOption'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography, FormControl } from '@mui/material'
import { useDebouncedTextField } from '../text/DebouncedInputHook'
import { useResultTree } from './ResultTreeHook'
import { useResultItemMenu } from './ResultItemMenuHook'
import ResultTree from './ResultTree'

export default function ResultTreeGroup({ data, defaultSortOrder, initialFilterText, setOpenDrawer }) {

    const { text: searchText, debouncedTextField } = useDebouncedTextField(initialFilterText)
    const [sortOrder, setSortOrder] = React.useState(defaultSortOrder)
    const { handleContextMenu } = useResultItemMenu(setOpenDrawer, data)
    const resultTreeObjectList = useResultTree(data, sortOrder, searchText, handleContextMenu)

    const resultTreeList = React.useMemo(() => {
        let treeList = []

        for (const typeGroup of resultTreeObjectList) {

            let typePageList = []

            for (const { renderedTreeItems, expandedList } of typeGroup['children']) {
                typePageList.push(<ResultTree renderedTreeItems={renderedTreeItems} expandedList={expandedList} />)
            }

            const nb = typeGroup['nb']
            const label = nb + " x " + typeGroup.label
            const sx = typeGroup.sx

            if(typePageList.length >= 2) {
                treeList.push(
                    // unmountOnExit: Only render the details when the accordion is expanded
                    <Accordion defaultExpanded={false} TransitionProps={{ unmountOnExit: true }} >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id={label}
                        >
                            <Typography sx={sx}>{label}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ ml: 2 }}>
                                {typePageList}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )

            } else {
                treeList.push(typePageList)
            }
        }


        return treeList
    }, [resultTreeObjectList])

    const treeGroupComponents = React.useMemo(() => {
        return (
            <Box sx={{ ml: 2 }}>
                <SortOrderOption {...{ sortOrder, setSortOrder }} />
                <FormControl fullWidth>
                    {debouncedTextField}
                </FormControl>
                {resultTreeList}
            </Box>
        )
    }, [sortOrder, setSortOrder, debouncedTextField, resultTreeList])

    return treeGroupComponents

}