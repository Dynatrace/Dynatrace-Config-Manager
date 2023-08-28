import * as React from 'react';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';
import { useProgress } from '../progress/ProgressHook';
import { TERRAFORM_LOAD_UI_PAYLOAD } from '../backend/backend';

export default function MigrateTenant() {

    const { setLoading, progressComponent } = useProgress()
    const { setExtractedData, resultComponents } = useMigrationResultHook()

    const handleChange = React.useCallback((data) => {
        if (data === null) {
            setLoading(true)
            return
        }

        setLoading(false)

        const { ui_payload } = data
        if (ui_payload) {
            setExtractedData(ui_payload)
        } else {
            setExtractedData(null)
        }

    }, [setExtractedData, setLoading])

    return (
        <React.Fragment>
            <MigrateButtonUncontrolled handleChange={handleChange} label={"Reload"} confirm={false} progressComponent={progressComponent} runOnce={true} api={TERRAFORM_LOAD_UI_PAYLOAD} />
            {resultComponents}
        </React.Fragment>
    );
}