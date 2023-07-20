import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';
import { TERRAFORM_LOAD_HISTORY_LIST, backendGet } from '../backend/backend';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { Typography } from '@mui/material';

export default function HistoryPanel() {
    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

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
                <Typography>
                    {" Name: " + convertTimestamp(historyItem["name"]) + " Nb Logs: " + historyItem["nb_logs"] + " Type: " + historyItem["type"]}
                </Typography>
            )
        }

        return components
    }, [historyList])

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateContext>
                <MigrateContextLoad>
                    <br />
                    <Typography>This page is a placeholder for the upcoming History feature. The list of actions below is still valid, but lacks buttons and details.</Typography>
                    <br />
                    {historyComponents}
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