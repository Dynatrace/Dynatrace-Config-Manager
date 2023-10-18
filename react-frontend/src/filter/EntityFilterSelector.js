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
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useEntityFilterKey, useEntityFilterList } from '../context/EntityFilterContext';
import { MenuItem, Paper } from '@mui/material';
import { getEntityFilterLabel } from './useFilterOnLabel';

export default function EntityFilterSelector() {

    const { entityFilterKey, setEntityFilterKey } = useEntityFilterKey()
    const { entityFilterList } = useEntityFilterList()

    const handleChangeEntityFilterKey = React.useMemo(() => {
        return (event) => {
            setEntityFilterKey(event.target.value);
        }
    }, [setEntityFilterKey])

    const entityFilterItems = React.useMemo(() => {
        const entityFilterItemList = []
        entityFilterList.forEach((entityFilter, index) => {
            entityFilterItemList.push(
                genEntityFilterItem(entityFilter)
            )
        })
        return entityFilterItemList
    }, [entityFilterList])

    const selector = React.useMemo(() => {
        return (

            <Select
                labelId="entityFilter-select-labell"
                id="entityFilter-select"
                value={entityFilterKey}
                label="Entity Filter"
                onChange={handleChangeEntityFilterKey}
            >
                {entityFilterItems}
            </Select>
        )
    }, [entityFilterKey, entityFilterItems, handleChangeEntityFilterKey])

    return (
        <Paper>
            <FormControl fullWidth>
                <InputLabel id="entityFilter-select-label">EntityFilter</InputLabel>
                {selector}
            </FormControl>
        </Paper>
    )
}

const genEntityFilterItem = (entityFilter) => {
    return (
        <MenuItem value={entityFilter.key} key={"menuItem" + entityFilter.key}>{getEntityFilterLabel(entityFilter)}</MenuItem>
    )
}