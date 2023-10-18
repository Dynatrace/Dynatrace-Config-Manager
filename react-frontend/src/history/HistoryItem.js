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