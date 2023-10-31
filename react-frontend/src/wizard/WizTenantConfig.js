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

import { Box, Button, Grid, Typography } from '@mui/material';
import * as React from 'react';
import TenantConfigBasics from '../credentials/TenantConfigBasics';
import { MatrixBlue, MatrixDisabled, MatrixRed, genMatrixButtonProps } from '../options/FirstTimeUser';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenant, useTenantKey } from '../context/TenantListContext';
import TenantConfigConnectionOptions from '../credentials/TenantConfigConnectionOptions';
import TenantSelector from '../credentials/TenantSelector';
import AddTenantButton from '../credentials/AddTenantButton';

const TenantLabel = {
  [TENANT_KEY_TYPE_MAIN]: "Source",
  [TENANT_KEY_TYPE_TARGET]: "Target",
}

const TenantDescription = {
  [TENANT_KEY_TYPE_MAIN]: "Tenant from which you will pull configurations",
  [TENANT_KEY_TYPE_TARGET]: "Tenant where you configs will end up",
}


export function WizTenantConfig({ showNextTab, tenantKeyType = TENANT_KEY_TYPE_MAIN }) {
  const { tenantKey } = useTenantKey(tenantKeyType)
  const { tenant: { url, APIKey, connectionTested, disableSystemProxies, proxyURL } } = useTenant(tenantKey)
  const { tenantKey: tenantKeySource } = useTenantKey(TENANT_KEY_TYPE_MAIN)
  const { tenant: { label: labelSource } } = useTenant(tenantKeySource)
  const [needsProxy, setNeedsProxy] = React.useState(false)

  const [buttonColor, buttonMessage, buttonDisabled] = React.useMemo(() => {
    if (connectionTested === true) {
      return [MatrixBlue, `Done with ${TenantLabel[tenantKeyType]} Credentials`, false]
    } else if (connectionTested === false) {
      return [MatrixRed, "Move on with a failed connection test", false]
    } else {
      return [MatrixDisabled, "Please test the connection", true]
    }
  }, [connectionTested, tenantKeyType])

  React.useEffect(() => {
    let areProxySettingsAlreadySet = false
    if ((disableSystemProxies === undefined || disableSystemProxies === false)
      && (proxyURL === undefined || proxyURL === "")) {
      // pass
    } else {
      areProxySettingsAlreadySet = true
    }

    if (needsProxy === true) {
      if (areProxySettingsAlreadySet) {
        return
      } else if (connectionTested === true) {
        setNeedsProxy(false)
        return
      }
    }
    if (areProxySettingsAlreadySet) {
      setNeedsProxy(true)
      return
    }
    if (url === "" || APIKey === "") {
      return
    }
    if (connectionTested === false) {
      setNeedsProxy(true)
      return
    }
  }, [url, APIKey, connectionTested, disableSystemProxies, proxyURL, needsProxy, setNeedsProxy])

  const isTargetSameAsSource = React.useMemo(() => {
    if (tenantKeyType === TENANT_KEY_TYPE_TARGET
      && tenantKey === tenantKeySource) {
      return true
    } else {
      return false
    }
  }, [tenantKeyType, tenantKey, tenantKeySource])

  return (
    <React.Fragment>
      <Grid container>
        <Grid item xs={6}>
          <Box sx={{ ml: 4 }}>
            {tenantKeyType !== TENANT_KEY_TYPE_TARGET ?
              null
              : <Typography sx={{ mb: 2 }} variant="h6">
                Source: {labelSource}
              </Typography>
            }
            <TenantSelector tenantKeyType={tenantKeyType} />
            <AddTenantButton tenantKeyType={tenantKeyType} />
          </Box>
        </Grid>
      </Grid>
      {isTargetSameAsSource ?
        <Typography variant='h6'><br /> Please make sure the Source and Target tenant are different.</Typography>
        : (
          <React.Fragment>
            <Grid container>
              <Grid item xs={6}>
                <Box sx={{ ml: 4 }}>
                  <TenantConfigBasics tenantKeyType={tenantKeyType} />
                </Box>
              </Grid>
              <Grid item xs={5}>
                <Box sx={{ ml: 4 }}>

                  <Typography variant='h6'>
                    {TenantLabel[tenantKeyType]} Tenant Credentials:
                  </Typography>
                  <Typography sx={{ ml: 2 }}>
                    {TenantLabel[tenantKeyType]}  tenant: {TenantDescription[tenantKeyType]}
                    <br /> Please provide the required information below:
                  </Typography>
                  <Typography sx={{ ml: 4 }}>
                    - Label or name
                    <br /> - Url
                    <br /> - APIKey
                  </Typography>
                  <Typography sx={{ ml: 2 }}>
                    When you are done, make sure you Test the Connection
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {!needsProxy ?
              null
              : (<Grid container sx={{ mt: 4 }}>
                <Grid item xs={6}>
                  <Box sx={{ ml: 4 }}>
                    <TenantConfigConnectionOptions tenantKeyType={tenantKeyType} />
                  </Box>
                </Grid>
                <Grid item xs={5}>
                  <Box sx={{ ml: 4 }}>
                    <Typography variant='h6'>Additional connection settings could be required</Typography>
                  </Box>
                </Grid>
              </Grid>
              )}
            <Grid container sx={{ mt: 4 }}>
              <Grid item xs={6}>
                <Box sx={{ ml: 4 }}>
                  <Button {...genMatrixButtonProps(buttonColor)} disabled={buttonDisabled} onClick={showNextTab}>{buttonMessage}</Button>
                </Box>

              </Grid>
              <Grid item xs={5}></Grid>
            </Grid>
          </React.Fragment>
        )
      }
    </React.Fragment >
  );
}