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
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

export const defaultColumnArray = ['data', '0']

const SORT_ORDER_ASC = "ASC"
const SORT_ORDER_DESC = "DESC"

const SORT_BY_MODULE = "module"
const SORT_BY_DONE = "done"
const SORT_BY_ADD = "add"
const SORT_BY_DESTROY = "destroy"
const SORT_BY_CHANGE = "change"
const SORT_BY_ERROR = "error"

const SORT_STATUS_TO_CODE = {
    [SORT_BY_DONE]: "I",
    [SORT_BY_ADD]: "A",
    [SORT_BY_DESTROY]: "D",
    [SORT_BY_CHANGE]: "U",
    [SORT_BY_ERROR]: "E",
}

const SORT_BY_LIST = [SORT_BY_DONE, SORT_BY_ADD, SORT_BY_DESTROY, SORT_BY_CHANGE, SORT_BY_ERROR]

export default function ExtractedTable({ data, resultKey, keyArray, handleClickMenu, searchText }) {

    const [sortByOrder, setSortByOrder] = React.useState([])
    const [sortedData, setSortedData] = React.useState([])
    const effectiveSortByOrder = React.useMemo(() => {
        return getEffectiveSortByOrder(sortByOrder);
    }, [sortByOrder])

    const sortData = React.useCallback((newSortByOrder, dataToSort) => {
        if (dataToSort && dataToSort.length > 0) {
            const [sortBy, sortOrder] = newSortByOrder

            let newSortedData = [...dataToSort]
            if (sortBy === SORT_BY_MODULE) {
                newSortedData = newSortedData.sort(genSortByModule(sortOrder));
            } else {
                newSortedData = newSortedData.sort(genSortByStatus(sortOrder, sortBy));
            }

            setSortedData(newSortedData)
        }
    }, [setSortedData])

    React.useEffect(() => {
        if (data && data.length > 0) {
            let sortedDataIndex = [...data]
            for (const idx in data) {
                sortedDataIndex[idx]["realIdx"] = idx
            }
            sortData(effectiveSortByOrder, sortedDataIndex)
        } else {
            setSortedData([])
            setSortByOrder([])
        }
    }, [data])

    const handleSortBy = React.useCallback((newSortBy) => {
        let newSortOrder = SORT_ORDER_ASC
        const [sortBy, sortOrder] = effectiveSortByOrder

        if (sortBy === newSortBy) {
            if (sortOrder === SORT_ORDER_ASC) {
                newSortOrder = SORT_ORDER_DESC
            }
        } else if (newSortBy === SORT_BY_MODULE) {
            // pass
        } else {
            newSortOrder = SORT_ORDER_DESC
        }

        setSortByOrder([newSortBy, newSortOrder])
    }, [setSortByOrder, effectiveSortByOrder])

    const sortButtons = React.useMemo(() => {
        const [sortBy, sortOrder] = effectiveSortByOrder

        let sortOrderIcon = (<ArrowUpwardIcon color="primary" />)
        if (sortOrder === SORT_ORDER_DESC) {
            sortOrderIcon = (<ArrowDownwardIcon color="primary" />)
        }

        let sortStatusesButtons = []
        const sizeStatus = 12 / 5
        for (const sortByButton of SORT_BY_LIST) {
            sortStatusesButtons.push(
                genSortButton(sortByButton, sizeStatus, handleSortBy, sortBy, sortOrderIcon)
            )
        }

        let sortButtons = (

            <Grid key={`sortButtons`} container>
                {genSortButton(SORT_BY_MODULE, 3, handleSortBy, sortBy, sortOrderIcon)}
                <Grid item xs={9}>
                    <Grid container>
                        {sortStatusesButtons}
                    </Grid>
                </Grid>
            </Grid>
        )

        return sortButtons
    }, [effectiveSortByOrder, handleSortBy])


    React.useEffect(() => {
        if (effectiveSortByOrder.length > 0) {
            sortData(effectiveSortByOrder, sortedData)
        }
    }, [effectiveSortByOrder])


    const hsBarComponents = React.useMemo(() => {
        if (sortedData && keyArray) {
            // pass
        } else {
            return null
        }

        let hsBarComponents = []
        let id = 0

        for (const row of Object.values(sortedData)) {

            let columnArray = [...defaultColumnArray]
            let rowArray = [...keyArray, row["realIdx"]]
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

    }, [sortedData, searchText, handleClickMenu, keyArray, resultKey, sortByOrder])

    return (
        <React.Fragment>
            {sortButtons}
            {hsBarComponents}
        </React.Fragment>
    )
}

function getEffectiveSortByOrder(sortByOrder) {
    let effectiveSortByOrder = [SORT_BY_MODULE, SORT_ORDER_ASC];
    if (sortByOrder.length > 0) {
        effectiveSortByOrder = sortByOrder;
    }
    return effectiveSortByOrder;
}

function genSortByModule(sortOrder) {
    let greater = 1
    let lesser = -1

    if (sortOrder === SORT_ORDER_DESC) {
        greater = -1
        lesser = 1
    }

    return (a, b) => {
        const valueA = a["module"];
        const valueB = b["module"];

        if (valueA < valueB) {
            return lesser;
        } else if (valueA > valueB) {
            return greater;
        } else {
            return 0;
        }
    }
}

function genSortByStatus(sortOrder, sortBy) {
    const sortByActionCode = SORT_STATUS_TO_CODE[sortBy]

    let greater = 1
    let lesser = -1

    if (sortOrder === SORT_ORDER_DESC) {
        greater = -1
        lesser = 1
    }

    return (a, b) => {
        let valueA = -1
        if (sortByActionCode in a["stats"]) {
            valueA = a["stats"][sortByActionCode]
        }

        let valueB = -1
        if (sortByActionCode in b["stats"]) {
            valueB = b["stats"][sortByActionCode]
        }

        if (valueA < valueB) {
            return lesser;
        } else if (valueA > valueB) {
            return greater;
        } else {
            return 0;
        }
    }
}

function genSortButton(sortByButton, sizeStatus, handleSortBy, sortBy, sortOrderIcon) {
    return <Grid item key={sortByButton} xs={sizeStatus}>
        <IconButton
            variant="outlined"
            onClick={() => { handleSortBy(sortByButton); }}
        >
            Sort by {sortByButton}
            {sortBy === sortByButton ? sortOrderIcon : null}
        </IconButton>
    </Grid>;
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
