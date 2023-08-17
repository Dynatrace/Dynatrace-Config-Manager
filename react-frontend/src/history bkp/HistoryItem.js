import { Typography } from '@mui/material';
import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { TERRAFORM_LOAD_HISTORY_ITEM, TERRAFORM_LOAD_HISTORY_LIST, backendGet } from '../backend/backend';
import EfficientAccordion from '../result/EfficientAccordion';
import HistoryLog from './HistoryLog';

export default function HistoryItem({ historyItem: { name, type } }) {

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
            console.log(historyItemList)
            // pass
        } else {
            return null
        }

        const list = []
        for (const log of historyItemList) {

            console.log(log)
            list.push(
                <EfficientAccordion
                    label={log}
                    labelColor='black'
                    defaultExpanded={false}
                    componentList={[<HistoryLog historyItemLog={{ name: name, type: type, log: log }} />]}
                />
            )
        }
        console.log(list)

        return list

    }, [historyItemList])

    return (
        logList
    )
}