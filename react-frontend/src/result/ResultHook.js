import * as React from 'react'
import _ from 'lodash';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import ResultDrawer from './ResultDrawer';
import { Typography } from '@mui/material';
import ExtractedTable from '../extraction/ExtractedTable';
import { useResultItemMenu } from './ResultItemMenuHook';
import { useResult } from '../context/ResultContext';

const error_color = 'error.dark'

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
        setOpenDrawer(false)
        return !_.isEmpty(extractedData)
    }, [extractedData])

    return { extractedData, setExtractedData, hasExtractedData, openDrawer, setOpenDrawer }
}

export const useMigrationResultHook = () => {

    const resultKey = 'migration'
    const { extractedData, setExtractedData, hasExtractedData, openDrawer, setOpenDrawer } = useResultHook(resultKey)
    const { handleContextMenu } = useResultItemMenu(setOpenDrawer, extractedData)

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
            && 'legend' in extractedData) {
            components.push(
                <Typography sx={{ mt: 1 }}>Status Legend: </Typography>
            )
            for (const [actionLetter, action] of Object.entries(extractedData['legend']['status'])) {
                components.push(
                    <Typography sx={{ ml: 1 }}>{actionLetter + ": " + action}</Typography>
                )
            }
        }

        if (extractedData
            && 'entities' in extractedData) {

            for (const [type, entityData] of Object.entries(extractedData['entities'])) {

                let schemaComponents = []

                if (type in extractedData['legend']
                    && 'schemas' in extractedData['legend'][type]) {

                    schemaComponents.push(
                        <Typography sx={{ mt: 1 }}>{type + " Schema Legend:"}</Typography>
                    )
                    for (const [schemaLabel, schema_key] of Object.entries(extractedData['legend'][type]['schemas'])) {
                        schemaComponents.push(
                            <Typography sx={{ ml: 1 }}>{schema_key + ": " + schemaLabel}</Typography>
                        )
                    }
                }

                components.push(
                    <React.Fragment>
                        <Typography sx={{ mt: 1 }}>{type}: </Typography>
                        {schemaComponents}
                        <ExtractedTable data={entityData} resultKey={resultKey} keyArray={['entities', type]} handleClickMenu={handleContextMenu} />
                    </React.Fragment>
                )
            }

        }

        return components

    }, [extractedData])

    const resultComponents = React.useMemo(() => {
        if (!_.isEmpty(extractedData)) {
            return (
                <ResultDrawer openDrawer={openDrawer} setOpenDrawer={setOpenDrawer}>
                    {tableComponents}
                </ResultDrawer>
            )
        }
        return null
    }, [tableComponents, openDrawer])

    return { setExtractedData, hasExtractedData, resultComponents }
}
