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

import { Box, Button, FormControl, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useExecutionOptionsState } from '../context/ExecutionContext';

export default function ExecutionOptions() {

    const { enableDashboards, enableOmitDestroy, terraformParallelism, enableUltraParallel, setEnableDashboards, setEnableOmitDestroy, setTerraformParallelism, setEnableUltraParallel } = useExecutionOptionsState()

    const [terraformParallelismInput, setTerraformParallelismInput] = React.useState(terraformParallelism)

    const handleEnableDashboardsToggle = React.useCallback(() => {
        setEnableDashboards(!enableDashboards)
    }, [setEnableDashboards, enableDashboards])

    const handleEnableOmitDestroy = React.useCallback(() => {
        setEnableOmitDestroy(!enableOmitDestroy)
    }, [setEnableOmitDestroy, enableOmitDestroy])

    const handleSetTerraformParallelism = React.useCallback((event) => {
        let newValue = event.target.value
        setTerraformParallelismInput(newValue)
        if (!newValue || newValue === "" || newValue < 1) {
            newValue = "1"
        }
        setTerraformParallelism(Number(newValue))
    }, [setTerraformParallelism])

    const handleEnableUltraParallelToggle = React.useCallback(() => {
        setEnableUltraParallel(!enableUltraParallel)
    }, [setEnableUltraParallel, enableUltraParallel])

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
            <Box sx={{ my: 1 }}>
                <Button onClick={handleEnableUltraParallelToggle} {...genButtonProps(enableUltraParallel)}>{genButtonText(ENABLE_ULTRA_PARALLEL, enableUltraParallel)}</Button>
                <Typography>{genInfoText(ENABLE_ULTRA_PARALLEL, enableUltraParallel)}</Typography>
            </Box>
            <FormControl fullWidth>
                <TextField id={"terraformParallelism-field"}
                    type="number"
                    variant="standard"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    label="Terraform parallelism parameter, or threads (5: lower Memory usage, 15: faster processing)" value={terraformParallelismInput}
                    onChange={handleSetTerraformParallelism} />
            </FormControl>
        </React.Fragment>
    );
}

function genButtonProps(isEnabled) {
    if (isEnabled) {
        return { variant: "contained", color: "secondary" }
    }

    return { variant: "contained", color: "primary" }
}

const ENABLE_DASHBOARDS = 'enableDashboards'
const ENABLE_OMIT_DESTROY = 'enableOmitDestroy'
const ENABLE_ULTRA_PARALLEL = 'enableUltraParallel'


const ON_LABELS = {
    [ENABLE_DASHBOARDS]: "Dashboards",
    [ENABLE_OMIT_DESTROY]: "Omit Destroy Actions",
    [ENABLE_ULTRA_PARALLEL]: "Ultra Parallel",
}
const OFF_LABELS = {
    [ENABLE_DASHBOARDS]: "Dashboards",
    [ENABLE_OMIT_DESTROY]: "Omit Destroy Actions",
    [ENABLE_ULTRA_PARALLEL]: "Ultra Parallel",
}
const ON_INFO_TEXT = {
    [ENABLE_DASHBOARDS]: "Could slow down the process",
    [ENABLE_OMIT_DESTROY]: "Will make the Apply less risky, but omit the deletion of a default config for example",
    [ENABLE_ULTRA_PARALLEL]: "Will run faster, exponential gains beyond 20'000 configs",
}
const OFF_INFO_TEXT = {
    [ENABLE_DASHBOARDS]: "Will speed up the process",
    [ENABLE_OMIT_DESTROY]: "Will work towards a complete sync, but could delete new configs pushed to the destination environment",
    [ENABLE_ULTRA_PARALLEL]: "Will create a single tf file per resource, making it easier to use outside of the tool",
}

function genButtonText(label, isEnabled) {
    if (isEnabled) {
        return "[Default] [Enabled] " + ON_LABELS[label]
    }

    return "[Disabled] " + OFF_LABELS[label]
}
function genInfoText(label, isEnabled) {
    if (isEnabled) {
        return ON_INFO_TEXT[label]
    }

    return OFF_INFO_TEXT[label]
}