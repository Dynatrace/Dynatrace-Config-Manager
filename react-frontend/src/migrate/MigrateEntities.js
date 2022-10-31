import { Typography } from '@mui/material';
import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import ExtractedTable from '../extraction/ExtractedTable';
import MatchButton from '../match/MatchButton';

export default function MigrateEntities() {

    const [extractedData, setExtractedData] = React.useState({});
    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)

    const resultComponents = React.useMemo(() => {
        let components = []


        if (extractedData
            && 'legend' in extractedData) {
            components.push(
                <Typography>Status Legend: </Typography>
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
                schemaComponents.push(
                    <Typography sx={{ mt: 1 }}>{type + " Schema Legend:"}</Typography>
                )
                for (const [schemaLabel, schema_key] of Object.entries(extractedData['legend'][type]['schemas'])) {
                    schemaComponents.push(
                        <Typography sx={{ ml: 1 }}>{schema_key + ": " + schemaLabel}</Typography>
                    )
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
