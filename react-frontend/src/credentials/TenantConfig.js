import { Fragment } from "react";
import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from "../context/TenantListContext";
import TestConnectionButton from "./TestConnectionButton";
import { PROXY_GET_ENV, backendGet } from "../backend/backend";

export const DEFAULT_MONACO_CONCURRENT_REQUESTS = 10

export default function TenantConfig({ tenantType = TENANT_KEY_TYPE_MAIN }) {
    const [envProxyURL, setEnvProxyUrl] = React.useState("")
    const { tenantKey } = useTenantKey(tenantType)
    const {
        tenant, setTenantLabel, setTenantUrl, setTenantHeaders, setTenantAPIKey,
        setTenantClientID, setTenantAccountID, setTenantClientSecret,
        setTenantMonacoConcurrentRequests, setTenantDisableSSLVerification,
        setTenantDisableSystemProxies, setTenantProxyURL, setTenantNotes
    } = useTenant(tenantKey)

    const tenantUrlDisplay = React.useMemo(() => {
        if (!tenant.url || tenant.url === "") {
            return "https://<YOUR_TENANT>.live.dynatrace.com/"
        } else {
            return tenant.url
        }
    }, [tenant.url])

    const tenantMonacoConcurrentRequests = React.useMemo(() => {
        if (!tenant.monacoConcurrentRequests || tenant.monacoConcurrentRequests === "" || tenant.monacoConcurrentRequests === 0) {
            return DEFAULT_MONACO_CONCURRENT_REQUESTS
        } else {
            return tenant.monacoConcurrentRequests
        }
    }, [tenant.monacoConcurrentRequests])

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

    const clearClientSecret = () => {
        setTenantClientSecret("")
    }

    const handleChangeLabel = (event) => {
        setTenantLabel(event.target.value)
    }

    const handleChangeUrl = (event) => {
        setTenantUrl(event.target.value)
    }

    const handleChangeHeaders = (event) => {
        setTenantHeaders(event.target.value)
    }

    const handleChangeAPIKey = (event) => {
        setTenantAPIKey(event.target.value)
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

    const handleChangeDisableSSLVerification = (event) => {
        setTenantDisableSSLVerification(event.target.checked)
    }

    const handleChangeDisableSystemProxies = (event) => {
        setTenantDisableSystemProxies(event.target.checked)
    }

    const handleChangeProxyURL = (event) => {
        setTenantProxyURL(event.target.value)
    }

    const handleChangeNotes = (event) => {
        setTenantNotes(event.target.value)
    }

    return (
        <Fragment>
            <Box sx={{ mt: 2 }}>
                <Typography>Required credentials:</Typography>
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
                                onChange={handleChangeUrl} />
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
                        <TestConnectionButton tenantKey={tenantKey} />
                    </React.Fragment>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"tenant-monacoConcurrentRequests-field" + tenantKey}
                                type="number"
                                variant="standard"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                label="Number of Concurrent Requests for Monaco cli calls to tenant" value={tenantMonacoConcurrentRequests}
                                onChange={handleChangeMonacoConcurrentRequests} />
                        </FormControl>
                    </React.Fragment>
                </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
                <Typography>Optional Connection Options:</Typography>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <FormControlLabel control={<Checkbox checked={tenant.disableSSLVerification === true}
                                onChange={handleChangeDisableSSLVerification} />} label={"Disable SSL Verification"} />
                        </FormControl>
                    </React.Fragment>
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
                                label={getProxyLabel(envProxyURL)} value={tenant.proxyURL} onChange={handleChangeProxyURL} disabled={tenant.disableSystemProxies}/>
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
            <Box sx={{ mt: 2 }}>
                <Typography>Other:</Typography>
                <Box sx={{ ml: 2 }}>
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

const getProxyLabel = (envProxyURL) => {
    let label = "Proxy URL"
    if (envProxyURL && envProxyURL !== "") {
        label += " [Default: "
        label += envProxyURL
        label += "]"
    }   

    return label
}


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