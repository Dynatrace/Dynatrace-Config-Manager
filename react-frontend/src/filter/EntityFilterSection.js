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