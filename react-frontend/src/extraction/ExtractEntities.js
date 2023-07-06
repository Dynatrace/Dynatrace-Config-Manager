import * as React from 'react';
import { EXTRACT_ENTITY_V2 } from '../backend/backend';
import ExtractButton from './ExtractButton';
import { Box, TextField } from '@mui/material';
import { FormControl } from '@mui/base';

export default function ExtractEntities({ tenantType }) {
    const [timeFromMinute, setTimeFromMinute] = React.useState(8400)
    const [timeToMinute, setTimeToMinute] = React.useState(0)

    const handleTimeFromMinute = (event) => {
        setTimeFromMinute(event.target.value)
    }
    const handleTimeToMinute = (event) => {
        setTimeToMinute(event.target.value)
    }

    return (
        <React.Fragment>
            <ExtractButton handleChange={() => { }} api={EXTRACT_ENTITY_V2}
                label="Extract Entities (Monaco cli)"
                tenantType={tenantType}
                extraSearchParams={{ 'time_from_minutes': timeFromMinute, 'time_to_minutes': timeToMinute }} />
            <Box sx={{ ml: 2 }}>
                <React.Fragment>
                    <FormControl fullWidth>
                        <TextField fullWidth id={"timeFromMinute"}
                            type="number"
                            variant="standard"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            label="Entities FROM, minutes in the past (Special Use Cases, defaults to 7 weeks, or 8400 minutes)"
                            value={timeFromMinute}
                            onChange={handleTimeFromMinute} />
                    </FormControl>
                </React.Fragment>
                <React.Fragment>
                    <FormControl fullWidth>
                        <TextField fullWidth id={"timeToMinute"}
                            type="number"
                            variant="standard"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            label="Entities TO, minutes in the past (Special Use Cases, defaults to 0)"
                            value={timeToMinute}
                            onChange={handleTimeToMinute} />
                    </FormControl>
                </React.Fragment>
            </Box >
        </React.Fragment >
    );
}
