import * as React from 'react';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';
import { useProgress } from '../progress/ProgressHook';

export default function MigrateEntities() {

    const { setLoading, progressComponent } = useProgress()
    const { setExtractedData, hasExtractedData, resultComponents } = useMigrationResultHook()

    const handleChange = React.useCallback((data) => {
        if (data === null) {
            setLoading(true)
        } else {
            setLoading(false)
        }
        setExtractedData(data)
    }, [setExtractedData, setLoading])

    const migrateButtonComponent = React.useMemo(() => {
        let label = "Show differences based on current cached files, See Post-Process on the Extract tab (Terraform cli)"
        let confirm = false

        return (
            <MigrateButtonUncontrolled handleChange={handleChange} label={label} confirm={confirm} progressComponent={progressComponent} />
        )

    }, [handleChange])

    return (
        <React.Fragment>
            {migrateButtonComponent}
            {resultComponents}
        </React.Fragment>
    );
}