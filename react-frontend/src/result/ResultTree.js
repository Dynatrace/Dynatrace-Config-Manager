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