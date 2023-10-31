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
import { TERRAFORM_APPLY_ALL } from "../backend/backend";
import { useProgress } from '../progress/ProgressHook';
import { useHandlePostTerraform } from '../backend/useHandlePost';
import { useHistoryStateValue } from '../context/HistoryContext';
import { terraformParamsAll } from '../result/ResultDrawerDetailsAll';

export function useHandleApplyAll() {
    const { progress, setProgress, progressComponent } = useProgress()
    const [applyStats, setApplyStats] = React.useState(null)

    const handleChange = React.useCallback((data) => {
        if (data && "ui_payload" in data && data["ui_payload"] && "stats" in data["ui_payload"] && data["ui_payload"]["stats"]) {
            setApplyStats(data["ui_payload"]["stats"])
        }
    }, [setApplyStats])

    const handleApplyAll = useApplyAllHandlePost(handleChange, setProgress)

    return { progress, progressComponent, handleApplyAll, applyStats }
}

function useApplyAllHandlePost(handleChange, setProgress) {
    const { lastPlanAllActionId } = useHistoryStateValue()
    const handlePost = useHandlePostTerraform(terraformParamsAll, handleChange, TERRAFORM_APPLY_ALL, () => lastPlanAllActionId, setProgress)

    return handlePost
}
