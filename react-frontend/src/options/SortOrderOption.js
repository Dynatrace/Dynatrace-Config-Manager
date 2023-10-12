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

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import * as React from 'react';

export const ALPHABETIC = "Alphabetic (Asc)"
export const FIRST_SEEN_TMS = "First Seen (Desc)"
export const LAST_SEEN_TMS = "Last Seen (Desc)"
export const MATCH_TYPE = "Match Type (Desc)"
const sortOrders = [ALPHABETIC, FIRST_SEEN_TMS, LAST_SEEN_TMS, MATCH_TYPE]

export default function SortOrderOption({ sortOrder, setSortOrder }) {

    const handleChangeSortOrderSelect = React.useMemo(() => {
        return (event) => {
            setSortOrder(sortOrders[event.target.value])
        }
    }, [setSortOrder])

    const menuItems = React.useMemo(() => {
        let itemList = []
        let idx = 0
        for (const value in sortOrders) {
            itemList.push(
                <MenuItem key={idx++} value={value}>{sortOrders[value]}</MenuItem>
            )
        }
        return itemList
    }, [])

    const selector = React.useMemo(() => {
        return (
            <Select
                key={"SortOrderItem" + sortOrders.indexOf(sortOrder)}
                value={sortOrders.indexOf(sortOrder)}
                label="Sort Order"
                onChange={handleChangeSortOrderSelect}
            >
                {menuItems}
            </Select>
        )
    }, [sortOrder, menuItems, handleChangeSortOrderSelect])

    return (
        <React.Fragment>
            <FormControl>
                <InputLabel>Sort Order</InputLabel>
                {selector}
            </FormControl>
        </React.Fragment>
    );
}


