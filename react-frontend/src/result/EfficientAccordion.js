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
                <AccordionDetails sx={{overflow: "auto"}}>
                    {componentList}
                </AccordionDetails>
            </Accordion>
        )
    } else {
        return null
    }
}
