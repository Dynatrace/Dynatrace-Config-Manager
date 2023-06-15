import * as React from 'react'
import EfficientAccordion from './EfficientAccordion'
import { STATUS_COLORS, STATUS_LABELS } from '../extraction/HorizontalStackedBar'
import { GetNumberedLabel } from './ResultDrawerList'
import { Checkbox, FormControl, FormControlLabel } from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

export default function ResultDrawerListSchema({ status, list, nbMax, keys, checkAllStatus, handleSetCheckAllStatus }) {

    const button = (
        <FormControl sx={{ color: STATUS_COLORS[status] }} fullWidth>
            <FormControlLabel
                control={<Checkbox checked={checkAllStatus === status}
                    onChange={() => { handleSetCheckAllStatus(status, keys) }}
                    icon={<RadioButtonUncheckedIcon />} checkedIcon={<RadioButtonCheckedIcon />} />}
                label="Select All" />
        </FormControl>
    )

    return (
        <EfficientAccordion
            label={GetNumberedLabel(STATUS_LABELS[status], list.length, nbMax)}
            labelColor={STATUS_COLORS[status]}
            componentList={
                [button, ...list]
            }
        />
    )
}
