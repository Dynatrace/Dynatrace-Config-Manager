import { Checkbox, FormControlLabel, Paper, TextField } from '@mui/material';
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

    const handleChangeStartTimestamp = (newValue) => {
        setEntityFilterStartTimestamp(newValue.valueOf())
    }
    const handleChangeEndTimestamp = (newValue) => {
        setEntityFilterEndTimestamp(newValue.valueOf())
    }

    const error = React.useMemo(() => {
        let props = {}
        if (entityFilter.startTimestamp > entityFilter.endTimestamp) {
            props.error = true
            props.helperText = "Negative timeframe"
        } else if (entityFilter.startTimestamp == entityFilter.endTimestamp) {
            props.error = true
            props.helperText = "Empty timeframe"
        }
        return props
    }, [entityFilter.startTimestamp, entityFilter.endTimestamp])

    const dateTimePickerComponents = React.useMemo(() => {
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
    }, [entityFilter.dateRangeChecked, entityFilter.startTimestamp, entityFilter.endTimestamp, error])

    return (
        <React.Fragment>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FormControlLabel control={<Checkbox checked={entityFilter.dateRangeChecked}
                    onChange={handleChangDateRangeChecked} />} label={label} />
                {dateTimePickerComponents}
            </LocalizationProvider>
        </React.Fragment>
    );
}
