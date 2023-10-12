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
import DateRangePicker from '../date/DateRangePicker';
import EntityFilterSelector from './EntityFilterSelector';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import EntityFilterNameInput from './EntityFilterNameInput';
import ForcedMatchInput from './ForcedMatchInput';
import AddEntityFilterButton from './AddEntityFilterButton';
import { useFilterOnLabel } from './useFilterOnLabel';
import FilterInput from './FilterInput';

export default function EntityFilterSection() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)
    const accordionLabel = useFilterOnLabel(entityFilter)

    return (
        <React.Fragment>
            <Accordion defaultExpanded>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    id="EntityFilterAccordion"
                >
                    <Typography>{accordionLabel}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <EntityFilterSelector />
                    <AddEntityFilterButton />
                    <EntityFilterNameInput />
                    <DateRangePicker label={"Migration Date Range (Entities first seen in the target tenant between these dates)"} />
                    <FilterInput label={"Filters"} />
                    <ForcedMatchInput label={"Forced Match Mapping (will not use extracted data, but LIVE API calls)"} />
                </AccordionDetails>
            </Accordion>
        </React.Fragment>
    )
}