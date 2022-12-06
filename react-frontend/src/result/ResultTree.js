import * as React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TreeView from '@mui/lab/TreeView'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'

export default function ResultTree({ renderedTreeItems, expandedList }) {

    const [expanded, setExpanded] = React.useState([])

    React.useEffect(() => {
        setExpanded(expandedList)
    }, [expandedList])

    const treeViewComponent = React.useMemo(() => {

        const onNodeToggle = (event, nodeIds) => {
            setExpanded(nodeIds)
        }

        const nb = renderedTreeItems.props.children.props.children.length
        const label = nb + " x " + renderedTreeItems.props.label
        const sx = renderedTreeItems.props.sx
        
        return (
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
                    </Box>
                </AccordionDetails>
            </Accordion>

        )
    }, [renderedTreeItems, expanded, setExpanded])


    return treeViewComponent
}