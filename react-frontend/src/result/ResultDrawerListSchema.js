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
import EfficientAccordion from './EfficientAccordion'
import { STATUS_COLORS, STATUS_LABELS } from '../extraction/HorizontalStackedBar'
import { GetNumberedLabel } from './ResultDrawerList'
import { Checkbox, FormControl, FormControlLabel, Typography } from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

export default function ResultDrawerListSchema({ status, list, nbMax, keys, checkAllStatus, handleSetCheckAllStatus }) {

    const button = (
        <FormControl key={`ResultDrawerListSchema-button`} sx={{ color: STATUS_COLORS[status] }} fullWidth>
            <FormControlLabel
                control={<Checkbox checked={checkAllStatus === status}
                    onChange={() => { handleSetCheckAllStatus(status, keys) }}
                    icon={<RadioButtonUncheckedIcon />} checkedIcon={<RadioButtonCheckedIcon />}
                />}
                label={`Select: All ${keys.length} configs` /*+ genTooManyLabel(keys.length)*/} />
        </FormControl>
    )

    let warning = null
    if(list.length < keys.length) {
        warning = <Typography>Manual selection restricted to first {list.length} elements. <br/> Use Search box above to find other elements.</Typography>
    }

    return (
        <EfficientAccordion
            label={GetNumberedLabel(STATUS_LABELS[status], keys.length, nbMax)}
            labelColor={STATUS_COLORS[status]}
            componentList={
                [button, warning, ...list]
            }
        />
    )
}

/*
export const genTooManyLabel = (genTooManyLabel) => {
    if (genTooManyLabel > NB_MAX_TARGETS) {
        return " ( More than 40 items: items with dependencies will not be pushed )"
    } else {
        return ""
    }
}
*/