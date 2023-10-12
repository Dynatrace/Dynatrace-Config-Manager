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

import { Box, Checkbox, FormControlLabel } from '@mui/material';
import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';

export default function ApplyMigrationBox() {

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter, setEntityFilterApplyMigrationChecked } = useEntityFilter(entityFilterKey)

    const applyMigrationComponents = React.useMemo(() => {

        const handleChangApplyMigrationChecked = (event) => {
            setEntityFilterApplyMigrationChecked(event.target.checked)
        }

        return (
            <FormControlLabel
                label={"Rebuild terraform folder based on current extraction"}
                control={
                    <Checkbox
                        checked={entityFilter.applyMigrationChecked}
                        onChange={handleChangApplyMigrationChecked}
                    />}
            />
        )
    }, [entityFilter, setEntityFilterApplyMigrationChecked])

    return (
        <Box sx={{ ml: 1 }}>
            {applyMigrationComponents}
        </Box>
    )
}
