import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import * as React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const error_color = 'error.dark'

export default function EfficientAccordion({ label, componentList, defaultExpanded = false, labelColor = error_color, labelVariant = null }) {

    if (componentList && componentList.length > 0) {
        return (
            // unmountOnExit: Only render the details when the accordion is expanded
            <Accordion defaultExpanded={defaultExpanded} TransitionProps={{ unmountOnExit: true }} >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    id={label}
                >
                    <Typography sx={{ color: labelColor, variant: labelVariant }}>{label}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {componentList}
                </AccordionDetails>
            </Accordion>
        )
    } else {
        return null
    }
}
