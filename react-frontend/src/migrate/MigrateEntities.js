import { Typography } from '@mui/material';
import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import ExtractedTable from '../extraction/ExtractedTable';
import MatchButton from '../match/MatchButton';

const error_color = 'error.dark'

export default function MigrateEntities() {

    const [extractedData, setExtractedData] = React.useState({});
    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)

    const resultComponents = React.useMemo(() => {
        let components = []


        if (extractedData
            && 'errors' in extractedData) {

            components.push(
                <Typography sx={{ color: error_color, mt: 1 }}>Error Messages: </Typography>
            )
            let messageNumber = 0
            for (const message of extractedData['errors']) {
                messageNumber++
                const line_break = '\n'
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
                        <ExtractedTable data={entityData} />
                    </React.Fragment>
                )
            }

        }

        return components

    }, [extractedData])

    const migrateButtonComponent = React.useMemo(() => {
        let label = "Pre-Migrate Configs V2"
        if (entityFilter.applyMigrationChecked) {
            label = "Migrate Configs V2"
        }

        return (
            <MatchButton handleChange={setExtractedData} api={MIGRATE_SETTINGS_2_0} label={label} />
        )

    }, [entityFilter.applyMigrationChecked])

    return (
        <React.Fragment>
            {migrateButtonComponent}
            {resultComponents}
        </React.Fragment>
    );
}
