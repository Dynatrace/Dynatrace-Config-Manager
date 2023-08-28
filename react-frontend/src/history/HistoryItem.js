import { Box, Button } from '@mui/material';
import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { TERRAFORM_LOAD_HISTORY_ITEM, backendGet } from '../backend/backend';

export default function HistoryItem({ historyItem: { name, type }, selectedHistoryLogPrev, setSelectedHistoryLog }) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const [historyItemList, setHistoryItemList] = React.useState([])

    React.useEffect(() => {
        backendGet(TERRAFORM_LOAD_HISTORY_ITEM, {
            tenant_key_main: tenantKeyMain,
            tenant_key_target: tenantKeyTarget,
            history_type: type,
            history_name: name,
        },
            promise =>
                promise
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        setHistoryItemList(data)
                    })
        )

    }, [tenantKeyMain, tenantKeyTarget, type, name])

    const logList = React.useMemo(() => {
        if (historyItemList && historyItemList.length > 0) {
            // pass
        } else {
            return null
        }

        const list = []
        for (const log of historyItemList) {
            let color = "primary"
            if(selectedHistoryLogPrev?.log === log) {
                color = "secondary"
            }

            list.push(
                <Box>
                    <Button onClick={() => { setSelectedHistoryLog({ name: name, type: type, log: log }) }} color={color}>
                        {log}
                    </Button>
                </Box>
            )
        }

        return list

    }, [historyItemList, setSelectedHistoryLog, selectedHistoryLogPrev, name, type])

    return (
        logList
    )
}