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

import { Box, Checkbox, FormControlLabel, Paper, TextField } from '@mui/material';
import * as React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import dayjs from 'dayjs';

export default function DateRangePicker({ label }) {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterDateRangeChecked, setEntityFilterStartTimestamp, setEntityFilterEndTimestamp } = useEntityFilter(entityFilterKey)

    const handleChangDateRangeChecked = (event) => {
        setEntityFilterDateRangeChecked(event.target.checked)
    }

    const error = React.useMemo(() => {
        let props = {}
        if (entityFilter.startTimestamp > entityFilter.endTimestamp) {
            props.error = true
            props.helperText = "Negative timeframe"
        } else if (entityFilter.startTimestamp === entityFilter.endTimestamp) {
            props.error = true
            props.helperText = "Empty timeframe"
        }
        return props
    }, [entityFilter])

    const dateTimePickerComponents = React.useMemo(() => {

        const handleChangeStartTimestamp = (newValue) => {
            setEntityFilterStartTimestamp(newValue.valueOf())
        }
        const handleChangeEndTimestamp = (newValue) => {
            setEntityFilterEndTimestamp(newValue.valueOf())
        }

        if (entityFilter.dateRangeChecked) {
            return (
                <Paper sx={{ mt: 0.5 }} elevation={0}>
                    <DateTimePicker
                        label="From"
                        value={dayjs.unix(entityFilter.startTimestamp / 1000.0)}
                        onChange={handleChangeStartTimestamp}
                        renderInput={(params) => <TextField {...params} {...error} />}
                    />
                    <DateTimePicker
                        label="To"
                        value={dayjs.unix(entityFilter.endTimestamp / 1000.0)}
                        onChange={handleChangeEndTimestamp}
                        renderInput={(params) => <TextField {...params} {...error} />}
                    />

                </Paper>
            )
        } else {
            return null
        }
    }, [entityFilter, error, setEntityFilterStartTimestamp, setEntityFilterEndTimestamp ])

    return (
        <React.Fragment>
            <Box sx={{ mt: 1 }} border={1}>
                <Box sx={{ mx: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <FormControlLabel control={<Checkbox checked={entityFilter.dateRangeChecked}
                            onChange={handleChangDateRangeChecked} />} label={label} />
                        {dateTimePickerComponents}
                    </LocalizationProvider>
                </Box>
            </Box>
        </React.Fragment>
    );
}
