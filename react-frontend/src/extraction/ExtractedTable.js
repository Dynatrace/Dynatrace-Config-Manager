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
import { Grid, IconButton, Typography } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HorizontalStackedBar, { STATUS_ORDER } from './HorizontalStackedBar';

export const defaultColumnArray = ['data', '0']

export default function ExtractedTable({ data, resultKey, keyArray, handleClickMenu, searchText }) {

    const hsBarComponents = React.useMemo(() => {
        if (data && keyArray) {
            // pass
        } else {
            return null
        }

        let hsBarComponents = []
        let id = 0

        for (const [idx, row] of Object.entries(data)) {

            let columnArray = [...defaultColumnArray]
            let rowArray = [...keyArray, idx]
            let ctxMenuBtnInfo = { 'value': { resultKey, 'rowArray': rowArray, 'columnArray': [...rowArray, ...columnArray], 'searchText': searchText } }

            let { statuses, foundText } = searchForText(row, searchText);

            if (foundText) {

                compileStatusStats(row, statuses);

                const onClickMenu = (e) => {
                    handleClickMenu(e, ctxMenuBtnInfo)
                };

                hsBarComponents.push(

                    <Grid key={`extractedTable-${row['module']}`} container>
                        <Grid item xs={3}>

                            <IconButton
                                variant="outlined"
                                onClick={onClickMenu}
                            >
                                <MoreHorizIcon color="primary" />
                                <Typography color="black" >{row['module']}</Typography>
                            </IconButton>
                        </Grid>
                        <Grid item xs={9}>
                            <HorizontalStackedBar id={id} statuses={statuses} onClickMenu={onClickMenu} />
                        </Grid>
                    </Grid>
                )
                id += 1
            }
        }

        return hsBarComponents

    }, [data, searchText, handleClickMenu, keyArray, resultKey])

    return hsBarComponents
}

function searchForText(row, searchText) {
    let foundText = false;
    let statuses = {
        "perStatus": {},
        "found": {},
        "foundAll": false,
    };


    if (searchText === "") {
        foundText = true;
        statuses['foundAll'] = true;
    } else {
        if ('module' in row && row['module'].toLowerCase().includes(searchText)) {
            foundText = true;
            statuses['foundAll'] = true;
        }
        if ('data' in row) {
            for (const item of Object.values(row['data'])) {
                let itemIsMatch = false;
                if ('entity_list' in item && item['entity_list'].toLowerCase().includes(searchText)) {
                    foundText = true;
                    itemIsMatch = true;
                } else if ('key_id' in item && item['key_id'].toLowerCase().includes(searchText)) {
                    foundText = true;
                    itemIsMatch = true;
                }

                if (itemIsMatch) {
                    if ('status' in item) {
                        const status = item['status'];
                        if (status in statuses['found']) {
                            // pass
                        } else {
                            statuses['found'][status] = 0;
                        }
                        statuses['found'][status]++;
                    }
                }
            }
        }
    }

    return { statuses, foundText };
}

function compileStatusStats(row, statuses) {
    if ('data' in row) {
        for (const item of Object.values(row['data'])) {
            if ('status' in item) {
                let status = item['status'];

                if (STATUS_ORDER.includes(status)) {
                    // pass
                } else {
                    status = "Other"
                }

                if (status in statuses['perStatus']) {
                    // pass
                } else {
                    statuses['perStatus'][status] = 0;
                }
                statuses['perStatus'][status]++;
            }
        }
    }
}
