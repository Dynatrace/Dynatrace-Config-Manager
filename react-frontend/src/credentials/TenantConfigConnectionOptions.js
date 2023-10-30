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

import { Fragment } from "react";
import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from "../context/TenantListContext";
import { PROXY_GET_ENV, backendGet } from "../backend/backend";

export default function TenantConfigConnectionOptions({ tenantKeyType = TENANT_KEY_TYPE_MAIN }) {
    const [envProxyURL, setEnvProxyUrl] = React.useState("")
    const { tenantKey } = useTenantKey(tenantKeyType)
    const {
        tenant, setTenantDisableSSLVerification,
        setTenantDisableSystemProxies, setTenantProxyURL
    } = useTenant(tenantKey)


    React.useEffect(() => {
        backendGet(PROXY_GET_ENV, null,
            promise =>
                promise
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        setEnvProxyUrl(data["proxy"])
                    })
        )
    }, [])

    const clearProxyURL = () => {
        setTenantProxyURL("")
    }

    const pasteProxyURL = () => {
        navigator.clipboard.readText()
            .then(text => {
                setTenantProxyURL(text)
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });

    }

    const handleChangeDisableSSLVerification = (event) => {
        setTenantDisableSSLVerification(event.target.checked)
    }

    const handleChangeDisableSystemProxies = (event) => {
        setTenantDisableSystemProxies(event.target.checked)
    }

    const handleChangeProxyURL = (event) => {
        setTenantProxyURL(event.target.value)
    }

    return (
        <Fragment>
            <Box sx={{ mt: 2 }}>
                <Typography>Connection Options [Optional]:</Typography>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <FormControlLabel control={<Checkbox checked={tenant.disableSystemProxies === true}
                                onChange={handleChangeDisableSystemProxies} />} label={"Disable Proxies (HTTP_PROXY & HTTPS_PROXY)"} />
                        </FormControl>
                    </React.Fragment>
                </Box>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"proxyURL-text-field" + tenantKey} variant="standard"
                                label={getProxyLabel(envProxyURL)} value={tenant.proxyURL} onChange={handleChangeProxyURL} disabled={tenant.disableSystemProxies} />
                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <IconButton onClick={pasteProxyURL} disabled={tenant.disableSystemProxies}>
                            <ContentPasteIcon />
                        </IconButton>
                        <IconButton onClick={clearProxyURL} disabled={tenant.disableSystemProxies}>
                            <ClearIcon />
                        </IconButton>
                    </React.Fragment>
                </Box>
            </Box>
        </Fragment>
    );
}

const getProxyLabel = (envProxyURL) => {
    let label = "Proxy URL"
    if (envProxyURL && envProxyURL !== "") {
        label += " [Default: "
        label += envProxyURL
        label += "]"
    }

    return label
}
