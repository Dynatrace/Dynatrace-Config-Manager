import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';
import { TERRAFORM_LOAD_HISTORY_LIST, backendGet } from '../backend/backend';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { Box, Button, Grid } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HistoryItem from './HistoryItem';
import HistoryLog from './HistoryLog';

const LIST_LEVEL = 1
const ITEM_LEVEL = 2
const LOG_LEVEL = 3

export default function HistoryPanel() {
    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)
    const [selectedItem, setSelectedItem] = React.useState(null)
    const [selectedHistoryLog, setSelectedHistoryLog] = React.useState(null)

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
            components.push(
                <Box>
                    <Button onClick={() => { setSelectedItem(historyItem) }}>
                        {" Name: " + convertTimestamp(historyItem["name"]) + " Nb Logs: " + historyItem["nb_logs"] + " Type: " + historyItem["sub_type"]}
                    </Button>
                </Box>
            )
        }

        return components
    }, [historyList, setSelectedItem])

    const historyItemComponent = React.useMemo(() => {
        if (selectedItem) {
            return <HistoryItem historyItem={selectedItem} setSelectedHistoryLog={setSelectedHistoryLog} />
        } else {
            return null
        }
    }, [selectedItem])

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
                <React.Fragment>
                    <Grid item direction={"column"} display={"flex"} justifyContent={'center'}>
                        <NavigateNextIcon />
                    </Grid>
                </React.Fragment>
            )

        }

        if (displayLevel >= LIST_LEVEL) {
            crumbs.push(
                <Button
                    onClick={() => { setSelectedItem(null) }}
                >
                    History List
                </Button>)
        }

        if (displayLevel >= ITEM_LEVEL) {
            addChevron()
            crumbs.push(
                <Button
                    onClick={() => { setSelectedHistoryLog(null) }}
                >
                    {selectedItem["sub_type"] + ": " + convertTimestamp(selectedItem["name"])}
                </Button>)
        }

        if (displayLevel >= LOG_LEVEL) {
            addChevron()
            crumbs.push(
                <Button
                    onClick={() => {  }}
                >
                    {selectedHistoryLog.log}
                </Button>)
        }

        return crumbs
    }, [displayLevel, setSelectedItem, setSelectedHistoryLog, selectedItem, selectedHistoryLog])

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateContext>
                <MigrateContextLoad>
                    <br />
                    <Grid container>
                        {breadcrumbs}
                    </Grid>
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
    const [datePart, timePart] = inputTimestamp.split('_');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split('-');

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hour}h${minute}m${second}s`;

    return `${formattedDate}, ${formattedTime}`;
}