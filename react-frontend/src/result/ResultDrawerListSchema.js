import * as React from 'react'
import EfficientAccordion from './EfficientAccordion'
import { STATUS_COLORS, STATUS_LABELS } from '../extraction/HorizontalStackedBar'
import { GetNumberedLabel } from './ResultDrawerList'
import { Checkbox, FormControl, FormControlLabel } from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

export const NB_MAX_TARGETS = 40

export default function ResultDrawerListSchema({ status, list, nbMax, keys, checkAllStatus, handleSetCheckAllStatus }) {

    const button = (
        <FormControl sx={{ color: STATUS_COLORS[status] }} fullWidth>
            <FormControlLabel
                control={<Checkbox checked={checkAllStatus === status}
                    onChange={() => { handleSetCheckAllStatus(status, keys) }}
                    icon={<RadioButtonUncheckedIcon />} checkedIcon={<RadioButtonCheckedIcon />}
                    disabled={keys.length > NB_MAX_TARGETS} />}
                label={"Select All" + genTooManyLabel(keys.length)} />
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


export const genTooManyLabel = (genTooManyLabel) => {
    if (genTooManyLabel > NB_MAX_TARGETS) {
        return " (DISABLED: too many items)"
    } else {
        return ""
    }
}