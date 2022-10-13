import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import * as React from 'react';
import DateRangePicker from '../date/DateRangePicker';
import EntityFilterSelector from './EntityFilterSelector';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import EntityFilterNameInput from './EntityFilterNameInput';
import ForcedMatchInput from './ForcedMatchInput';
import ApplyMigrationBox from './ApplyMigrationBox';

export default function EntityFilterSection() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)

    const accordionLabel = React.useMemo(() => {
        let label = ""
        let isFirstConcat = true

        const concatList = [
            {
                'enabled': entityFilter.dateRangeChecked,
                'label': "Date Range"
            },
            {
                'enabled': entityFilter.forcedMatchChecked,
                'label': "Forced Entity Match"
            }
        ]

        for (const concat of concatList) {
            if (concat['enabled']) {
                if (isFirstConcat) {
                    label += "Filtering on "
                    isFirstConcat = false
                } else {
                    label += ","
                }
                label += " "
                label += concat['label']
            }
        }

        if (isFirstConcat) {
            label = "Not Filtering"
        } else {
            label += " ( " + entityFilter.label + " )"
        }
        return label
    }, [entityFilterKey, entityFilter.forcedMatchChecked, entityFilter.label, entityFilter.dateRangeChecked])

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
                    <EntityFilterNameInput />
                    <DateRangePicker label={"Migration Date Range"} />
                    <ForcedMatchInput label={"Forced Match Mapping"} />
                    <ApplyMigrationBox/>
                </AccordionDetails>
            </Accordion>
        </React.Fragment>
    )
}