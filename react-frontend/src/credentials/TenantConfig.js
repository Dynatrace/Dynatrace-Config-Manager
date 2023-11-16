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
import { Box, TextField, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from "../context/TenantListContext";
import TenantConfigBasics from "./TenantConfigBasics";
import TenantConfigConnectionOptions from "./TenantConfigConnectionOptions";

export const DEFAULT_MONACO_CONCURRENT_REQUESTS = 10

export default function TenantConfig({ tenantKeyType = TENANT_KEY_TYPE_MAIN }) {
    const { tenantKey } = useTenantKey(tenantKeyType)
    const {
        tenant, setTenantHeaders,
        setTenantClientID, setTenantAccountID, setTenantClientSecret,
        setTenantMonacoConcurrentRequests,
        setTenantNotes
    } = useTenant(tenantKey)


    const tenantMonacoConcurrentRequests = React.useMemo(() => {
        if (!tenant.monacoConcurrentRequests || tenant.monacoConcurrentRequests === "" || tenant.monacoConcurrentRequests === 0) {
            return DEFAULT_MONACO_CONCURRENT_REQUESTS
        } else {
            return tenant.monacoConcurrentRequests
        }
    }, [tenant.monacoConcurrentRequests])


    /*
    const pasteHeaders = () => {
        navigator.clipboard.readText()
            .then(text => {
                setTenantHeaders(text)
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });

    }

    const clearHeaders = () => {
        setTenantHeaders("")
    }
    */

    const pasteClientID = () => {
        navigator.clipboard.readText()
            .then(text => {
                setTenantClientID(text)
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });

    }

    const clearClientID = () => {
        setTenantClientID("")
    }

    const pasteAccountID = () => {
        navigator.clipboard.readText()
            .then(text => {
                setTenantAccountID(text)
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });

    }

    const clearAccountID = () => {
        setTenantAccountID("")
    }

    const pasteClientSecret = () => {
        navigator.clipboard.readText()
            .then(text => {
                setTenantClientSecret(text)
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });

    }


    const clearClientSecret = () => {
        setTenantClientSecret("")
    }

    const handleChangeHeaders = (event) => {
        setTenantHeaders(event.target.value)
    }

    const handleChangeClientID = (event) => {
        setTenantClientID(event.target.value)
    }

    const handleChangeAccountID = (event) => {
        setTenantAccountID(event.target.value)
    }

    const handleChangeClientSecret = (event) => {
        setTenantClientSecret(event.target.value)
    }

    const handleChangeMonacoConcurrentRequests = (event) => {
        setTenantMonacoConcurrentRequests(event.target.value)
    }

    const handleChangeNotes = (event) => {
        setTenantNotes(event.target.value)
    }

    return (
        <Fragment>
            <TenantConfigBasics tenantKeyType={tenantKeyType} />
            <TenantConfigConnectionOptions tenantKeyType={tenantKeyType} />
            <Box sx={{ mt: 2 }}>
                <Typography>Other:</Typography>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"tenant-monacoConcurrentRequests-field" + tenantKey}
                                type="number"
                                variant="standard"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                label="Number of Concurrent Requests for extraction cli calls to tenant" value={tenantMonacoConcurrentRequests}
                                onChange={handleChangeMonacoConcurrentRequests} />
                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"notes-text-field" + tenantKey} variant="standard"
                                label="Notes" value={tenant.notes} onChange={handleChangeNotes} />
                        </FormControl>
                    </React.Fragment>
                </Box>
            </Box>
        </Fragment>
    );
}

/*

                    <React.Fragment>
                        <FormControl fullWidth>
                            <FormControlLabel control={<Checkbox checked={tenant.disableSSLVerification === true}
                                onChange={handleChangeDisableSSLVerification} />} label={"Disable SSL Verification"} />
                        </FormControl>
                    </React.Fragment>
*/


/*

            <Box sx={{ mt: 2 }}>
                <Typography>Optional OAuth:</Typography>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"clientID-text-field" + tenantKey} variant="standard"
                                label="Client ID" value={tenant.clientID} onChange={handleChangeClientID} />
                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <IconButton onClick={pasteClientID}>
                            <ContentPasteIcon />
                        </IconButton>
                        <IconButton onClick={clearClientID}>
                            <ClearIcon />
                        </IconButton>
                    </React.Fragment>
                </Box>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"clientSecret-text-field" + tenantKey} variant="standard" type="password"
                                label="Client Secret" value={tenant.clientSecret} onChange={handleChangeClientSecret} />
                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <IconButton onClick={pasteClientSecret}>
                            <ContentPasteIcon />
                        </IconButton>
                        <IconButton onClick={clearClientSecret}>
                            <ClearIcon />
                        </IconButton>
                    </React.Fragment>
                </Box>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"accountID-text-field" + tenantKey} variant="standard"
                                label="Dynatrace Account URN" value={tenant.accountID} onChange={handleChangeAccountID} />
                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <IconButton onClick={pasteAccountID}>
                            <ContentPasteIcon />
                        </IconButton>
                        <IconButton onClick={clearAccountID}>
                            <ClearIcon />
                        </IconButton>
                    </React.Fragment>
                </Box>
            </Box>
*/

/*
<Box sx={{ mt: 2 }}>
    <Typography>Optional credentials:</Typography>
    <Box sx={{ ml: 2 }}>
        <React.Fragment>
            <FormControl fullWidth>
                <TextField id={"headers-text-field" + tenantKey} variant="standard" type="password"
                    label="UI Headers for unofficial APIs" value={tenant.headers} onChange={handleChangeHeaders} />
            </FormControl>
        </React.Fragment>
        <React.Fragment>
            <IconButton onClick={pasteHeaders}>
                <ContentPasteIcon />
            </IconButton>
            <IconButton onClick={clearHeaders}>
                <ClearIcon />
            </IconButton>
        </React.Fragment>
    </Box>
</Box>
*/