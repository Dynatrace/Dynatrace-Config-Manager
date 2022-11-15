import * as React from 'react';
import { MIGRATE_SETTINGS_2_0 } from '../backend/backend';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import MatchButton from '../match/MatchButton';
import { useMigrationResultHook } from '../result/ResultHook';

export default function MigrateEntities() {

    const { setExtractedData, hasExtractedData, resultComponents } = useMigrationResultHook()

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)

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
