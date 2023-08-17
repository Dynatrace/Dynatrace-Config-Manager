import { Button, Typography } from '@mui/material';
import * as React from 'react';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { TERRAFORM_LOAD_HISTORY_ITEM_LOG, TERRAFORM_OPEN_HISTORT_ITEM_LOG_VSCODE as TERRAFORM_OPEN_HISTORY_ITEM_LOG_VSCODE, backendGet, backendPost } from '../backend/backend';
import TFAnsiText from '../result/TFAnsiText';
import TFLog from '../result/TFLog';

export default function HistoryLog({ historyItemLog: { name, type, log } }) {

    const { tenantKey: tenantKeyMain } = useTenantKey(TENANT_KEY_TYPE_MAIN)
    const { tenantKey: tenantKeyTarget } = useTenantKey(TENANT_KEY_TYPE_TARGET)

    const [historyItemLog, setHistoryItemLog] = React.useState([])

    React.useEffect(() => {
        backendGet(TERRAFORM_LOAD_HISTORY_ITEM_LOG, {
            tenant_key_main: tenantKeyMain,
            tenant_key_target: tenantKeyTarget,
            history_type: type,
            history_name: name,
            history_log: log,
        },
            promise =>
                promise
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        setHistoryItemLog(data)
                    })
        )

    }, [tenantKeyMain, tenantKeyTarget, type, name, log])

    const openVSCode = React.useCallback(() => {
        backendPost(TERRAFORM_OPEN_HISTORY_ITEM_LOG_VSCODE, null, {
            tenant_key_main: tenantKeyMain,
            tenant_key_target: tenantKeyTarget,
            history_type: type,
            history_name: name,
            history_log: log,
        },
            promise =>
                promise
                    .then(response => {
                        return null
                    })
        )

    }, [tenantKeyMain, tenantKeyTarget, type, name, log])

    const logComponent = React.useMemo(() => {
        const { lines, modules, other_lines } = historyItemLog

        if (lines) {
            return (
                <TFAnsiText logList={lines} />
            )
        } else {

            return (
                <TFLog logs={modules} other={other_lines} actionLabel={""} actionId={name} defaultExpanded={true} />
            )
        }

    }, [historyItemLog])

    return (
        <React.Fragment>
            <Button onClick={openVSCode}>Open in VSCode</Button>
            {logComponent}
        </React.Fragment>
    )
}