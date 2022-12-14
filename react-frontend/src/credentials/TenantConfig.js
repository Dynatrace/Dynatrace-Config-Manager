import { Fragment } from "react";
import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { TENANT_KEY_TYPE_MAIN, useTenant, useTenantKey } from "../context/TenantListContext";

export default function TenantConfig({ tenantType = TENANT_KEY_TYPE_MAIN }) {
    const { tenantKey } = useTenantKey(tenantType)
    const { tenant, setTenantLabel, setTenantUrl, setTenantHeaders, setTenantAPIKey, setTenantDisableSSLVerification, setTenantDisableSystemProxies, setTenantNotes } = useTenant(tenantKey)

    const tenantUrlDisplay = React.useMemo(() => {
        if (!tenant.url || tenant.url === "") {
            return "https://<YOUR_TENANT>.live.dynatrace.com/"
        } else {
            return tenant.url
        }
    }, [tenant.url])

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

    const handleChangeHeaders = (event) => {
        setTenantHeaders(event.target.value)
    }

    const handleChangeAPIKey = (event) => {
        setTenantAPIKey(event.target.value)
    }

    const handleChangeDisableSSLVerification = (event) => {
        setTenantDisableSSLVerification(event.target.checked)
    }

    const handleChangeDisableSystemProxies = (event) => {
        setTenantDisableSystemProxies(event.target.checked)
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
                                label="Access Token (API Key): Extract scopes: Read entities & Read settings Push scopes: Write settings" value={tenant.APIKey} onChange={handleChangeAPIKey} />
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
                </Box>
            </Box>
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