import * as React from 'react';
import { useEntityFilter, useEntityFilterKey } from '../context/EntityFilterContext';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';

export default function MigrateEntities() {

    const { setExtractedData, hasExtractedData, resultComponents } = useMigrationResultHook()

    const { entityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)

    const migrateButtonComponent = React.useMemo(() => {
        let label = "Compare Both Environment Configs"
        let confirm = false
        if (entityFilter.applyMigrationChecked) {
            label = "Update Target Environment Configs"
            confirm = true
        }

        return (
            <MigrateButtonUncontrolled handleChange={setExtractedData} label={label} confirm={confirm} />
        )

    }, [entityFilter.applyMigrationChecked])

    return (
        <React.Fragment>
            {migrateButtonComponent}
            {resultComponents}
        </React.Fragment>
    );
}
