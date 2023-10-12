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

import { Box, Button, Typography } from '@mui/material';
import * as React from 'react';
import { useExecutionOptionsState } from '../context/ExecutionContext';

export default function ExecutionOptions() {

    const { enableDashboards, enableOmitDestroy, setEnableDashboards, setEnableOmitDestroy } = useExecutionOptionsState()

    const handleEnableDashboardsToggle = React.useCallback(() => {
        setEnableDashboards(!enableDashboards)
    }, [setEnableDashboards, enableDashboards])

    const handleEnableOmitDestroy = React.useCallback(() => {
        setEnableOmitDestroy(!enableOmitDestroy)
    }, [setEnableOmitDestroy, enableOmitDestroy])

    return (
        <React.Fragment>
            <Box sx={{ my: 1 }}>
                <Button onClick={handleEnableDashboardsToggle} {...genButtonProps(enableDashboards)}>{genButtonText(ENABLE_DASHBOARDS, enableDashboards)}</Button>
                <Typography>{genInfoText(ENABLE_DASHBOARDS, enableDashboards)}</Typography>
            </Box>
            <Box sx={{ my: 1 }}>
                <Button onClick={handleEnableOmitDestroy} {...genButtonProps(enableOmitDestroy)}>{genButtonText(ENABLE_OMIT_DESTROY, enableOmitDestroy)}</Button>
                <Typography>{genInfoText(ENABLE_OMIT_DESTROY, enableOmitDestroy)}</Typography>
            </Box>
        </React.Fragment>
    );
}

function genButtonProps(isEnabled) {
    if (isEnabled) {
        return { variant: "contained", textTransform: 'none', color: "secondary" }
    }

    return { variant: "contained", textTransform: 'none', color: "primary" }
}

const ENABLE_DASHBOARDS = 'enableDashboards'
const ENABLE_OMIT_DESTROY = 'enableOmitDestroy'


const ON_LABELS = {
    [ENABLE_DASHBOARDS]: "Dashboards",
    [ENABLE_OMIT_DESTROY]: "Omit Destroy Actions",
}
const OFF_LABELS = {
    [ENABLE_DASHBOARDS]: "Dashboards",
    [ENABLE_OMIT_DESTROY]: "Omit Destroy Actions",
}
const ON_INFO_TEXT = {
    [ENABLE_DASHBOARDS]: "Could slow down the process",
    [ENABLE_OMIT_DESTROY]: "Will make the Apply less risky, but omit the deletion of a default config for example",
}
const OFF_INFO_TEXT = {
    [ENABLE_DASHBOARDS]: "Will speed up the process",
    [ENABLE_OMIT_DESTROY]: "Will work towards a complete sync, but could delete new configs pushed to the destination environment",
}

function genButtonText(label, isEnabled) {
    if (isEnabled) {
        return "[Enabled] " + ON_LABELS[label]
    }

    return "[Default] [Disabled] " + OFF_LABELS[label]
}
function genInfoText(label, isEnabled) {
    if (isEnabled) {
        return ON_INFO_TEXT[label]
    }

    return OFF_INFO_TEXT[label]
}