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
import { useTenantKey } from '../context/TenantListContext';
import { useFinishedInfo } from './ExtractionHooks';
import { DONE, NOT_STARTED } from '../progress/ProgressHook';
import { Grid, Typography } from '@mui/material';
import { convertTimestamp } from '../history/HistoryPanel';


const FINISHED_AT = "finished_at"
const CACHE_VERSION = "cache_version"
const TYPE_LABEL = "label"

const ANY = "any"
const CONFIGS = "configs"
const ENTITIES = "entities"

const OLD_VERSION = "pre-v0.19"
const V0_19 = "v0.19"
const LATEST_CACHE_VERSION = "v0.19.2"

const BREAKING_CACHE_VERSIONS = {
    [ANY]: [OLD_VERSION],
    [CONFIGS]: [OLD_VERSION],
    [ENTITIES]: [OLD_VERSION],
}
const OUTDATED_CACHE_VERSIONS = {
    [ANY]: [],
    [CONFIGS]: [],
    [ENTITIES]: [V0_19]
}
const LATEST_CACHE_VERSIONS = {
    [ANY]: [LATEST_CACHE_VERSION],
    [CONFIGS]: [V0_19, LATEST_CACHE_VERSION],
    [ENTITIES]: [LATEST_CACHE_VERSION],
}

const twelveHours = (12 * 60 * 60 * 1000)

export default function ExtractionInfo({ api, tenantKeyType, extractionProgress, setIsOldCache }) {
    const [finishedData, setFinishedData] = React.useState({})
    const { tenantKey } = useTenantKey(tenantKeyType)
    const { progressComponent, getFinished } = useFinishedInfo(tenantKey, api, setFinishedData)

    React.useEffect(() => {
        setFinishedData(null)
        setIsOldCache(true)

        if (extractionProgress === DONE || extractionProgress === NOT_STARTED) {
            getFinished()

        }

    }, [extractionProgress])

    const finishedInfo = React.useMemo(() => {
        if (finishedData) {
            // pass
        } else {
            return null
        }


        let extractedAtLabel = ""
        let isOldLabel = null
        if (FINISHED_AT in finishedData) {
            const extractedAt = convertTimestamp(finishedData[FINISHED_AT])
            if ((new Date() - new Date(extractedAt)) > twelveHours) {
                isOldLabel = (
                    <b>[old] </b>
                )
                setIsOldCache(true)
            } else {
                setIsOldCache(false)
            }
            extractedAtLabel = `Extracted at ${convertTimestamp(finishedData[FINISHED_AT])}`
        }

        let cache_version = "pre-v0.19"
        let outdatedLabel = ""
        let outdatedColor = ""

        if (CACHE_VERSION in finishedData) {
            cache_version = finishedData[CACHE_VERSION]
        }

        let type = ANY
        if (TYPE_LABEL in finishedData) {
            type = finishedData[TYPE_LABEL]
        }

        if (BREAKING_CACHE_VERSIONS[type].includes(cache_version)) {
            outdatedColor = "error.light"
            outdatedLabel = "Cache incompatible, please re-extract"
        } else if (OUTDATED_CACHE_VERSIONS[type].includes(cache_version)) {
            outdatedColor = "warning.light"
            outdatedLabel = "Re-extract cache for better entity matching"
        } else if (LATEST_CACHE_VERSIONS[type].includes(cache_version)) {
            cache_version = ""
            outdatedLabel = ""
        }

        if (extractedAtLabel === "") {
            extractedAtLabel = cache_version
        } else if (cache_version === "") {
            // pass
        } else {
            extractedAtLabel = `${extractedAtLabel}, ${cache_version}`
        }

        return (
            <Grid container direction={"column"} alignItems={'center'}>
                <Grid item>
                    <Typography>{isOldLabel}{extractedAtLabel}</Typography>
                </Grid>
                {outdatedLabel === "" ? null
                    : <Grid item>
                        <Typography color={outdatedColor}>{outdatedLabel}</Typography>
                    </Grid>
                }
            </Grid>)

    }, [finishedData])


    return (
        <React.Fragment>
            <Grid container direction={'row'} alignItems={'center'} >
                {progressComponent}
                {finishedInfo}
            </Grid>
        </React.Fragment >
    );
}
