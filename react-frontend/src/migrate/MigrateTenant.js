/*
Copyright 2023 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and 
limitations under the License.
*/

import * as React from 'react';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';
import { DONE, ERROR, LOADING, useProgress } from '../progress/ProgressHook';
import { TERRAFORM_LOAD_UI_PAYLOAD } from '../backend/backend';

export default function MigrateTenant() {

    const { progress, setProgress, progressComponent } = useProgress()
    const { setExtractedData, resultComponents } = useMigrationResultHook()

    const handleChange = React.useCallback((data) => {
        if (data === null) {
            return
        }

        const { ui_payload } = data
        if (ui_payload) {
            setExtractedData(ui_payload)
        } else {
            setProgress(ERROR)
            setExtractedData(null)
        }

    }, [setExtractedData, setProgress])

    return (
        <React.Fragment>
            <MigrateButtonUncontrolled handleChange={handleChange} label={"Reload"} confirm={false} progressComponent={progressComponent} progress={progress} runOnce={true} api={TERRAFORM_LOAD_UI_PAYLOAD} setProgress={setProgress} />
            {resultComponents}
        </React.Fragment>
    );
}