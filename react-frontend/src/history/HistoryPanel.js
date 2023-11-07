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
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';
import { TERRAFORM_LOAD_HISTORY_LIST, backendGet } from '../backend/backend';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { Box, Button, Checkbox, FormControl, FormControlLabel, Grid } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HistoryItem from './HistoryItem';
import HistoryLog from './HistoryLog';

const LIST_LEVEL = 1
const ITEM_LEVEL = 2
const LOG_LEVEL = 3

export default function HistoryPanel() {
    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)
    const [applyOnly, setApplyOnly] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState(null)
    const [selectedItemPrev, setSelectedItemPrev] = React.useState(null)
    const [selectedHistoryLog, setSelectedHistoryLog] = React.useState(null)
    const [selectedHistoryLogPrev, setSelectedHistoryLogPrev] = React.useState(null)

    const [historyList, setHistoryList] = React.useState([])

    React.useEffect(() => {
        backendGet(TERRAFORM_LOAD_HISTORY_LIST, {
            tenant_key_main: tenantKeyMain,
            tenant_key_target: tenantKeyTarget,
        },
            promise =>
                promise
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        setHistoryList(data)
                    })
        )

    }, [tenantKeyMain, tenantKeyTarget])

    const historyComponents = React.useMemo(() => {
        const components = []

        for (const historyItem of historyList) {
            let color = "primary"
            if (selectedItemPrev === historyItem) {
                color = "secondary"
            }
            let applyText = ""
            if (historyItem["has_apply"] === true) {
                applyText = " Apply"
            } else if (applyOnly) {
                continue
            }
            components.push(
                <Box key={`history-${historyItem["name"]}`}>
                    <Button onClick={() => { setSelectedItem(historyItem) }} color={color}>
                        {" Name: " + convertTimestamp(historyItem["name"]) + " Nb Logs: " + historyItem["nb_logs"] + " Type: " + historyItem["sub_type"] + applyText}
                    </Button>
                </Box>
            )
        }

        return components
    }, [historyList, setSelectedItem, selectedItemPrev, applyOnly])

    const historyItemComponent = React.useMemo(() => {
        if (selectedItem) {
            return <HistoryItem historyItem={selectedItem} selectedHistoryLogPrev={selectedHistoryLogPrev} setSelectedHistoryLog={setSelectedHistoryLog} />
        } else {
            return null
        }
    }, [selectedItem, selectedHistoryLogPrev])

    const historyItemLogComponent = React.useMemo(() => {
        if (selectedHistoryLog) {
            return <HistoryLog historyItemLog={selectedHistoryLog} />
        } else {
            return null
        }
    }, [selectedHistoryLog])

    const displayLevel = React.useMemo(() => {
        if (historyItemComponent == null) {
            return LIST_LEVEL
        } else if (historyItemLogComponent == null) {
            return ITEM_LEVEL
        } else {
            return LOG_LEVEL
        }
    }, [historyItemComponent, historyItemLogComponent])

    const breadcrumbs = React.useMemo(() => {
        let crumbs = []

        const addChevron = () => {
            crumbs.push(
                <React.Fragment key={`chevron-${crumbs.length}`}>
                    <Grid item display={"flex"} justifyContent={'center'}>
                        <NavigateNextIcon />
                    </Grid>
                </React.Fragment>
            )

        }

        if (displayLevel >= LIST_LEVEL) {
            crumbs.push(
                <Button key={`crumbs-${crumbs.length}`}
                    onClick={() => { setSelectedItem(null); setSelectedItemPrev(selectedItem); setSelectedHistoryLog(null); setSelectedHistoryLogPrev(selectedHistoryLog) }}
                >
                    History List
                </Button>)
        }

        if (displayLevel >= ITEM_LEVEL) {
            addChevron()
            crumbs.push(
                <Button key={`crumbs-${crumbs.length}`}
                    onClick={() => { setSelectedHistoryLog(null); setSelectedHistoryLogPrev(selectedHistoryLog) }}
                >
                    {selectedItem["sub_type"] + ": " + convertTimestamp(selectedItem["name"])}
                </Button>)
        }

        if (displayLevel >= LOG_LEVEL) {
            addChevron()
            crumbs.push(
                <Button key={`crumbs-${crumbs.length}`}
                    onClick={() => { }}
                >
                    {selectedHistoryLog.log}
                </Button>)
        }

        return crumbs
    }, [displayLevel, setSelectedItem, setSelectedHistoryLog, selectedItem, selectedHistoryLog])

    const applyOnlyComponent = React.useMemo(() => {
        if (displayLevel === LIST_LEVEL) {

            const handleChangeApplyOnly = (event) => {
                setApplyOnly(event.target.checked)
            }

            return (
                <React.Fragment>
                    <FormControl fullWidth>
                        <FormControlLabel control={<Checkbox checked={applyOnly === true}
                            onChange={handleChangeApplyOnly} />} label={"Apply actions only"} />
                    </FormControl>
                </React.Fragment>)

        }

        return null

    }, [displayLevel, applyOnly, setApplyOnly])

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateContext>
                <MigrateContextLoad>
                    <br />
                    <Grid container>
                        {breadcrumbs}
                    </Grid>
                    {applyOnlyComponent}
                    <br />
                    <br />
                    {displayLevel === LIST_LEVEL && historyComponents}
                    {displayLevel === ITEM_LEVEL && historyItemComponent}
                    {displayLevel === LOG_LEVEL && historyItemLogComponent}
                </MigrateContextLoad>
            </MigrateContext>
        </React.Fragment>
    );
}

function convertTimestamp(inputTimestamp) {
    if (inputTimestamp) {
        const [datePart, timePart] = inputTimestamp.split('_');

        if (datePart, timePart) {
            const [year, month, day] = datePart.split('-');
            const [hour, minute, second] = timePart.split('-');

            const formattedDate = `${year}-${month}-${day}`;
            const formattedTime = `${hour}:${minute}:${second}`;

            return `${formattedDate}, ${formattedTime}`;
        }
        return inputTimestamp
    }
}