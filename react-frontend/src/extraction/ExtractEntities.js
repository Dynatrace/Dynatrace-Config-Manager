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

import * as React from 'react';
import { EXTRACT_ENTITY_V2 } from '../backend/backend';
import ExtractButton from './ExtractButton';
import { Box, TextField } from '@mui/material';
import { FormControl } from '@mui/base';

const timeFrom7WeeksMinutes = 7 * 7 * 24 * 60

export default function ExtractEntities({ tenantType }) {
    const [timeFromMinute, setTimeFromMinute] = React.useState(timeFrom7WeeksMinutes)
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
                            label={"Entities FROM, minutes in the past (Special Use Cases, defaults to 7 weeks, or " + timeFrom7WeeksMinutes + " minutes)"}
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
