import * as React from 'react';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';

export default function MigrateEntities() {

    const { setExtractedData, hasExtractedData, resultComponents } = useMigrationResultHook()

    const migrateButtonComponent = React.useMemo(() => {
        let label = "Show differences based on current cached files, See Post-Process on the Extract tab (Terraform cli)"
        let confirm = false

        return (
            <MigrateButtonUncontrolled handleChange={setExtractedData} label={label} confirm={confirm} />
        )

    }, [setExtractedData])

    return (
        <React.Fragment>
            {migrateButtonComponent}
            {resultComponents}
        </React.Fragment>
    );
}