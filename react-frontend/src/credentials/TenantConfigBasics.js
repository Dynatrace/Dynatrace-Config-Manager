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
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, TextField, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from "../context/TenantListContext";
import TestConnectionButton from "./TestConnectionButton";
import EfficientAccordion from '../result/EfficientAccordion';
import DocumAPIToken from '../docum/DocumAPIToken';

export default function TenantConfigBasics({ tenantKeyType = TENANT_KEY_TYPE_MAIN }) {
    const [tenantUrlError, setTenantUrlError] = React.useState(false)
    const [tenantUrlErrorMessage, setTenantUrlErrorMessage] = React.useState("")
    const { tenantKey } = useTenantKey(tenantKeyType)
    const { tenant, setTenantLabel, setTenantUrl, setTenantAPIKey } = useTenant(tenantKey)

    const tenantUrlDisplay = React.useMemo(() => {
        if (!tenant.url || tenant.url === "") {
            return "https://<YOUR_TENANT>.live.dynatrace.com/"
        } else {
            return tenant.url
        }
    }, [tenant.url])

    React.useEffect(() => {
        let urlError = false;
        let message = "";

        if (tenant.url.endsWith("/")) {
            // pass
        } else {
            urlError = true
            message += "The URL should end with a slash '/'. "
        }

        if (tenant.url.includes(".live.dynatrace.com")) {
            // pass
        } else {
            if (tenant.url.includes(".apps.dynatrace.com")) {
                urlError = true
                message += "Use the '.live' URL, not the '.apps' one. "
            }
        }

        if (tenantUrlError !== urlError) {
            setTenantUrlError(urlError)
        }
        if (tenantUrlErrorMessage !== message) {
            setTenantUrlErrorMessage(message)
        }

    }, [tenant])

    const pasteAPIKey = () => {
        navigator.clipboard.readText()
            .then(text => {
                setTenantAPIKey(text)
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });

    }

    const clearAPIKey = () => {
        setTenantAPIKey("")
    }

    const handleChangeLabel = (event) => {
        setTenantLabel(event.target.value)
    }

    const handleChangeUrl = (event) => {
        setTenantUrl(event.target.value)
    }

    const handleChangeAPIKey = (event) => {
        setTenantAPIKey(event.target.value)
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Typography>Credentials [Required]:</Typography>
            <Box sx={{ ml: 2 }}>
                <React.Fragment>
                    <FormControl fullWidth>
                        <TextField id={"tenant-text-field" + tenantKey} variant="standard"
                            label="Tenant Label" value={tenant.label} onChange={handleChangeLabel} />
                    </FormControl>
                </React.Fragment>
                <React.Fragment>
                    <FormControl fullWidth>
                        <TextField id={"tenant-url-field" + tenantKey} variant="standard"
                            label="Tenant Url (https://<YOUR_TENANT>.live.dynatrace.com/)" value={tenantUrlDisplay}
                            onChange={handleChangeUrl}
                            error={tenantUrlError} helperText={tenantUrlErrorMessage} />
                    </FormControl>
                </React.Fragment>
                <React.Fragment>
                    <FormControl fullWidth>
                        <TextField id={"api_key-text-field" + tenantKey} variant="standard" type="password"
                            label="Access Token (API Key): see documentation tab" value={tenant.APIKey} onChange={handleChangeAPIKey} />
                    </FormControl>
                </React.Fragment>
                <React.Fragment>
                    <IconButton onClick={pasteAPIKey}>
                        <ContentPasteIcon />
                    </IconButton>
                    <IconButton onClick={clearAPIKey}>
                        <ClearIcon />
                    </IconButton>
                </React.Fragment>
                <React.Fragment>
                    <EfficientAccordion
                        defaultExpanded={false}
                        label="Access Token Documentation (and curl commands)"
                        labelColor="primary.main"
                        componentList={[(<DocumAPIToken url={tenant.url} tenantKeyType={tenantKeyType} />)]} />
                </React.Fragment>
                <React.Fragment>
                    <TestConnectionButton tenantKey={tenantKey} />
                </React.Fragment>
            </Box>
        </Box>
    );
}
