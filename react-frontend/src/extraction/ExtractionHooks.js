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
import { EXTRACT_CONFIGS, EXTRACT_ENTITY_V2, backendGet, backendPost } from "../backend/backend";
import { timeFrom7WeeksMinutes, timeToNow } from './ExtractEntities';
import { DONE, ERROR, LOADING, useProgress } from '../progress/ProgressHook';

export function useHandleExtractConfigs(tenantKey) {
    const { progress, setProgress, progressComponent } = useProgress()

    const handleExtractConfigs = useHandleExtract(tenantKey, {}, setProgress, EXTRACT_CONFIGS)

    return { progress, progressComponent, handleExtractConfigs }
}

export function useHandleExtractEntities(tenantKey, timeFrom = timeFrom7WeeksMinutes, timeTo = timeToNow) {
    const { progress, setProgress, progressComponent } = useProgress()

    const handleExtractEntities = useHandleExtract(tenantKey, { 'time_from_minutes': timeFrom, 'time_to_minutes': timeTo }, setProgress, EXTRACT_ENTITY_V2)

    return { progress, progressComponent, handleExtractEntities }
}

export function useHandleExtract(tenantKey, extraSearchParams, setProgress, api) {
    return React.useCallback(() => {
        const searchParams = { 'tenant_key': tenantKey, 'use_cache': false, ...extraSearchParams };

        setProgress(LOADING);
        const thenFunction = promise => promise
            .then(response => {
                setProgress(DONE);
                return response.json();
            })

        const catchFunction = (error) => {
            setProgress(ERROR)
        }

        backendPost(api, null, searchParams, thenFunction, catchFunction, false);
    }, [tenantKey, api, setProgress, extraSearchParams]);
}

export function useFinishedInfo(tenantKey, api, setFinishedData) {
    const { progress, setProgress, progressComponent } = useProgress()

    const getFinished = React.useCallback(() => {
        setFinishedData(null)
        const searchParams = { 'tenant_key': tenantKey };

        setProgress(LOADING);

        const catchFunction = (error) => {
            setFinishedData({ "cacheError": "No cache available, please run extraction." })
            setProgress(ERROR)
        }

        const thenFunction = promise => promise
            .then(response => {
                return response.json();
            })
            .then(data => {
                if (Object.keys(data).length === 0) {
                    catchFunction(data)
                } else {
                    setFinishedData(data)
                    setProgress(DONE);
                }
            })

        backendGet(api, searchParams, thenFunction, catchFunction, false);
    }, [tenantKey, api, setProgress, setFinishedData]);

    return { progress, progressComponent, getFinished }
}
