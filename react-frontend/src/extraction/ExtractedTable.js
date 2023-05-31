import * as React from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HorizontalStackedBar, { statusOrder } from './HorizontalStackedBar';

export const defaultColumnArray = ['data', '0']

export default function ExtractedTable({ data, resultKey, keyArray, handleClickMenu, searchText }) {

    const hsBarComponents = React.useMemo(() => {
        if (data && data['items'] && keyArray) {
            // pass
        } else {
            return null
        }

        let hsBarComponents = []
        let id = 0

        for (const [idx, row] of Object.entries(data['items'])) {

            let columnArray = [...defaultColumnArray]
            let rowArray = [...keyArray, 'items', idx]
            let ctxMenuBtnInfo = { 'value': { resultKey, 'rowArray': rowArray, 'columnArray': [...rowArray, ...columnArray], 'searchText': searchText } }

            let { statuses, foundText } = searchForText(row, searchText);

            if (foundText) {

                compileStatusStats(row, statuses);

                const onClickMenu = (e) => {
                    handleClickMenu(e, ctxMenuBtnInfo)
                };

                hsBarComponents.push(

                    <Grid container>
                        <Grid item xs={3}>

                            <Grid container>
                                <Grid item xs={1}>
                                    <IconButton
                                        variant="outlined"
                                        color="primary"
                                        onClick={onClickMenu}
                                    >
                                        <MoreHorizIcon />
                                    </IconButton>
                                </Grid>
                                <Grid item xs={11} sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                    <Typography >{row['schemaId']}</Typography>
                                </Grid>
                            </Grid>
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
        if ('schemaId' in row && row['schemaId'].toLowerCase().includes(searchText)) {
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

                if (statusOrder.includes(status)) {
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
