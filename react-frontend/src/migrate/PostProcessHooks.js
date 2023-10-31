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
import { MIGRATE_SETTINGS_2_0 } from "../backend/backend";
import { useProgress } from '../progress/ProgressHook';
import { useHandlePostSpecific } from '../backend/useHandlePost';
import { getTimestampActionId } from '../date/DateFormatter';
import { useHistoryState } from '../context/HistoryContext';

export function useHandlePostProcess() {
    const { progress, setProgress, progressComponent } = useProgress()
    const [planStats, setPlanStats] = React.useState(null)

    const handleChange = React.useCallback((data) => {
        if(data && "stats" in data && data["stats"]) {
            setPlanStats(data["stats"])
        }
    }, [setPlanStats])

    const handlePostProcess = usePostProcessHandlePost(handleChange, setProgress)

    return { progress, progressComponent, handlePostProcess, planStats }
}

function usePostProcessHandlePost(handleChange, setProgress) {
    const entityFilter = usePostProcessEntityFilter()
    const handlePost = useHandlePostSpecific(entityFilter, handleChange, MIGRATE_SETTINGS_2_0, setProgress)

    return handlePost
}

export function usePostProcessEntityFilter() {
    const { setLastPlanAllActionId } = useHistoryState()

    const getActionId = React.useCallback(() => {
        const newActionId = getTimestampActionId();
        setLastPlanAllActionId(newActionId);
        return newActionId;
    }, [setLastPlanAllActionId]);

    return { 'applyMigrationChecked': true, getActionIdFunc: getActionId }
}
