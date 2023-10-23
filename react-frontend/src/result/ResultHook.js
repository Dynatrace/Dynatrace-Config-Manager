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

import * as React from 'react'
import _ from 'lodash';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import ResultDrawer from './ResultDrawer';
import { Box, FormControl, Grid, IconButton, Paper, TextField, Typography } from '@mui/material';
import ExtractedTable from '../extraction/ExtractedTable';
import { useResultItemMenu } from './ResultItemMenuHook';
import { useResult } from '../context/ResultContext';
import ResultTreeGroup from './ResultTreeGroup';
import { MATCH_TYPE } from '../options/SortOrderOption';
import ReactJson from 'react-json-view';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import HorizontalStackedBar, { STATUS_ORDER } from '../extraction/HorizontalStackedBar';
import EfficientAccordion from './EfficientAccordion';
import ResultDetails from './ResultDetails';

const error_color = 'error.dark'
const warning_color = 'secondary.dark'
export const MIGRATION_RESULT_KEY = 'migration'

export const useResultHook = (resultKey) => {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const { result: extractedData, setResult: setExtractedData } = useResult(resultKey)
    const [openDrawer, setOpenDrawer] = React.useState(false);

    React.useMemo(() => {
        setExtractedData(undefined)
        setOpenDrawer(false)
    }, [tenantKeyMain, tenantKeyTarget])

    const hasExtractedData = React.useMemo(() => {
        if (shouldKeepDrawerOpen(extractedData)) {
            // pass
        } else {
            setOpenDrawer(false)
        }
        return !_.isEmpty(extractedData)
    }, [extractedData])

    return { extractedData, setExtractedData, hasExtractedData, openDrawer, setOpenDrawer }
}

export const useMigrationResultHook = () => {

    const [searchTextInput, setSearchTextInput] = React.useState("")
    const [searchText, setSearchText] = React.useState("")
    const { extractedData, setExtractedData, hasExtractedData, openDrawer, setOpenDrawer } = useResultHook(MIGRATION_RESULT_KEY)
    const { handleContextMenu } = useResultItemMenu(setOpenDrawer, extractedData)

    const handleLaunchSearch = React.useCallback(() => {
        setSearchText(searchTextInput.toLowerCase())
    }, [setSearchText, searchTextInput])

    const handleClearSearchText = React.useCallback(() => {
        setSearchText("");
        setSearchTextInput("");
    }, [setSearchTextInput])

    const progressComponents = React.useMemo(() => {

        let components = []

        if (extractedData
            && 'stats' in extractedData) {

            components.push(
                <Box sx={{ mt: 2, mb: 1 }} align={"center"}>
                    <Typography color="black" variant={"h4"}>Overall Progress</Typography>
                </Box>

            )

            const statuses = buildStatuses(extractedData);

            components.push(
                <Grid container>
                    <Grid item xs={3}></Grid>
                    <Grid item xs={9}>
                        <HorizontalStackedBar id={'statistics'} statuses={statuses} onClickMenu={() => { }} />
                    </Grid>
                </Grid>
            )
            components.push(
                <ResultDetails resultKey={MIGRATION_RESULT_KEY} setExtractedData={setExtractedData} />
            )
        }

        return components
    }, [extractedData])

    const searchComponents = React.useMemo(() => {
        let components = []

        components.push(
            <Box sx={{ mt: 2 }}>
                <Box sx={{ ml: 2 }}>
                    <Grid container>
                        <Grid item xs={6}>
                            <Typography sx={{ mt: 2, mb: 0 }} variant="h5">Search </Typography>
                            <Grid container>
                                <Grid item xs={10}>

                                    <FormControl fullWidth>
                                        <TextField id={"search-field"} variant="standard"
                                            label="Text to search for (Hit enter to search)" value={searchTextInput} onChange={(event) => {
                                                setSearchTextInput(event.target.value)
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    handleLaunchSearch()
                                                }
                                            }} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={2}>
                                    <IconButton onClick={handleClearSearchText}>
                                        <ClearIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                            <IconButton onClick={handleLaunchSearch} color="primary">
                                <SearchIcon />
                                <Typography>Search for module or key_id (entityId: coming soon)</Typography>
                            </IconButton>
                        </Grid>
                        <Grid item xs={6}>

                        </Grid>
                    </Grid>
                </Box>
            </Box>
        )

        return components
    }, [searchTextInput, handleLaunchSearch, setSearchTextInput, handleClearSearchText])

    const tableComponents = React.useMemo(() => {
        let components = []

        if (extractedData
            && 'errors' in extractedData) {

            components.push(
                <Typography sx={{ color: error_color, mt: 1 }}>Error Messages: </Typography>
            )
            let messageNumber = 0
            for (const message of extractedData['errors']) {
                messageNumber++
                components.push(
                    <Typography sx={{ color: error_color, mt: 0.5, ml: 1 }} style={{ whiteSpace: 'pre-line' }}>Message #{messageNumber}:</Typography>
                )
                components.push(
                    <Typography sx={{ color: error_color, ml: 2 }} style={{ whiteSpace: 'pre-line' }}>{message}</Typography>
                )
            }
        }

        if (extractedData
            && 'aggregate_error' in extractedData) {

            components.push(
                <Typography sx={{ color: error_color, mt: 1 }}>API Call Errors: </Typography>
            )
            let messageNumber = 0
            for (const message of extractedData['aggregate_error']) {
                messageNumber++
                components.push(
                    <Typography sx={{ color: error_color, mt: 0.5, ml: 1 }} style={{ whiteSpace: 'pre-line' }}>Message #{messageNumber}:</Typography>
                )
                components.push(
                    <Typography sx={{ color: error_color, ml: 2 }} style={{ whiteSpace: 'pre-line' }}>{message}</Typography>
                )
            }
        }

        if (extractedData
            && 'aggregate_error_response' in extractedData) {

            components.push(
                <Typography sx={{ color: error_color, mt: 1 }}>API Call Errors: </Typography>
            )
            let messageNumber = 0
            for (const message of extractedData['aggregate_error_response']) {
                messageNumber++
                const agg_err = JSON.parse(message)
                components.push(
                    <EfficientAccordion
                        label={
                            "Message #" + messageNumber + ":" + agg_err.err_msg
                        }
                        componentList={
                            ([<ReactJson src={JSON.parse(agg_err.err_resp)} />])
                        } />
                )
            }
        }

        if (extractedData
            && 'warnings' in extractedData) {

            components.push(
                <Typography sx={{ color: warning_color, mt: 1 }}>Warnings: </Typography>
            )
            let messageNumber = 0
            for (const message of extractedData['warnings']) {
                messageNumber++
                if (extractedData['warnings'].length > 1) {
                    components.push(
                        <Typography sx={{ color: warning_color, mt: 0.5, ml: 1 }} style={{ whiteSpace: 'pre-line' }}>Message #{messageNumber}:</Typography>
                    )
                }
                components.push(
                    <Typography sx={{ color: warning_color, ml: 2 }} style={{ whiteSpace: 'pre-line' }}>{message}</Typography>
                )
            }
        }

        if (extractedData
            && 'entity_match_missing' in extractedData) {

            let missingList = []
            for (const entityId of Object.keys(extractedData['entity_match_missing'])) {
                let entityLabel = entityId + ' (' + 'ERR_NOT_EXTRACTED' + ')'

                missingList.push(
                    <Typography sx={{ ml: 1 }}>{entityLabel}</Typography>
                )

            }

            components.push(
                <EfficientAccordion
                    label={"ERROR: UNMATCHED Entities MISSING from the extraction (Expected for Forced Match or 'Dead' Entity)"}
                    componentList={missingList}
                />
            )
        }

        if (extractedData
            && 'entity_match_unmatched_dict' in extractedData) {


            const unmatchedTreeList = []
            unmatchedTreeList.push(
                <ResultTreeGroup data={extractedData['entity_match_unmatched_dict']} defaultSortOrder={MATCH_TYPE} />
            )

            components.push(
                <EfficientAccordion
                    label={"ERROR: UNMATCHED Entities that were part of the extraction (May need to ajust Rules using the Match Tab)"}
                    componentList={unmatchedTreeList}
                />
            )
        }

        if (extractedData
            && 'modules' in extractedData) {

            let schemaComponents = []

            let label = "All Configs, per module"

            components.push(
                <React.Fragment>
                    <Typography sx={{ mt: 2, mb: 1 }} align="center" variant="h4">{label} </Typography>
                    {schemaComponents}
                    <ExtractedTable data={extractedData['modules']} resultKey={MIGRATION_RESULT_KEY} keyArray={['modules']} handleClickMenu={handleContextMenu} searchText={searchText} />
                </React.Fragment>
            )

        }

        /*
        if (extractedData
            && 'legend' in extractedData) {
            components.push(
                <Typography sx={{ mt: 1 }}>Status Legend: </Typography>
            )
            for (const [actionLetter, action] of Object.entries(extractedData['legend'])) {
                components.push(
                    <Typography sx={{ ml: 1 }}>{actionLetter + ": " + action}</Typography>
                )
            }
        }
        */

        return components

    }, [extractedData, searchText])

    const resultComponents = React.useMemo(() => {
        if (!_.isEmpty(extractedData)) {
            return (
                <ResultDrawer openDrawer={openDrawer} setOpenDrawer={setOpenDrawer}>
                    <Paper sx={{ p: 1 }} elevation={3} >
                        {progressComponents}
                    </Paper>
                    {searchComponents}
                    {tableComponents}
                </ResultDrawer>
            )
        }
        return null
    }, [tableComponents, openDrawer, searchComponents])

    return { setExtractedData, hasExtractedData, resultComponents }
}
export function shouldKeepDrawerOpen(extractedData) {
    return extractedData && "keepDrawerOpen" in extractedData && extractedData["keepDrawerOpen"] === true;
}

function buildStatuses(extractedData) {
    const perStatus = {};
    for (const [statusKey, statusValue] of Object.entries(extractedData['stats'])) {
        if (STATUS_ORDER.includes(statusKey)) {
            perStatus[statusKey] = statusValue;
        } else {
            const statusKeyOther = "Other"
            if (statusKeyOther in perStatus) {
                // pass
            } else {
                perStatus[statusKeyOther] = 0;
            }
            perStatus[statusKeyOther] += statusValue;
        }
    }

    const statuses = {
        "foundAll": true,
        "perStatus": perStatus,
    };
    return statuses;
}

