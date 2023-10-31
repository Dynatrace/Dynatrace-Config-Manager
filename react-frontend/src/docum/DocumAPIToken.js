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

import { Box, Typography } from '@mui/material';
import * as React from 'react';
import EfficientAccordion from '../result/EfficientAccordion';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET } from '../context/TenantListContext';


const accessTokenHygieneInfo =
    `  - This tool is not using a Vault to store your access tokens.
  - It is recommended that the tokens you create:
    - Have a 24 hours life span
    - Are deleted when you are done using the tool.
`

const tokenSection =
    `
Here is a list of the required scopes for your access token
  - You can copy paste the curl commands below to create the tokens easily
`

const readScopeList =
    `  - Read entities
  - Read settings
  - Read SLO
  - Access problem and event feed, metrics, and topology
  - Read configuration
  - Read network zones
  - Read Credential Vault
`

const readScopeSection =
    `${readScopeList}

`

const writeScopeSection =
    `${readScopeList}
  - All of the Read Scopes (see above)
  - Write settings
  - Write SLO
  - Create and read synthetic monitors, locations, and nodes
  - Write configuration
  - Write network zones
  - Write Credential Vault
  - Capture request data

`



export default function DocumAPIToken({ url = undefined, tenantKeyType = undefined }) {

    const documList = React.useMemo(() => {

        const [curlRead, curlWrite] = genCurlCommands(url)

        let documList = []

        documList.push(<Typography variant='h6'>Access Token hygiene</Typography>)
        documList.push(...multiLinesToComponent(accessTokenHygieneInfo))
        //documList.push(...multiLinesToComponent(tokenSection))

        if (tenantKeyType === TENANT_KEY_TYPE_TARGET) {
            // pass
        } else {
            documList.push(<Typography variant='h6'>Manual creation (UI)</Typography>)
            documList.push((<EfficientAccordion
                defaultExpanded={false}
                label="Source tenant scopes"
                labelColor={null}
                componentList={[
                    ...multiLinesToComponent(readScopeSection),
                ]
                } />))
            documList.push(<Typography variant='h6'>Curl command creation:</Typography>)
            documList.push(...multiLinesToComponent(curlRead))

        }

        if (tenantKeyType === TENANT_KEY_TYPE_MAIN) {
            // pass
        } else {
            documList.push((<EfficientAccordion
                defaultExpanded={false}
                label="Target tenant scopes"
                labelColor={null}
                componentList={[
                    ...multiLinesToComponent(writeScopeSection),
                ]
                } />))
            documList.push((<EfficientAccordion
                defaultExpanded={false}
                label="Target tenant curl command"
                labelColor={null}
                componentList={[
                    ...multiLinesToComponent(curlWrite),
                ]
                } />))
        }

        return documList

    }, [url])

    return (
        <React.Fragment>
            {documList}
        </React.Fragment>
    );
}

function multiLinesToComponent(lines) {
    let documList = []

    const documLines = lines.split('\n')
    for (const documLine of Object.values(documLines)) {

        documList.push(
            <Box
                sx={{
                    mt: 0.5,
                    overflowX: 'auto',
                }}
            >
                <Typography component="pre" display="block" style={{ wordWrap: "break-word" }}>{documLine}</Typography>
            </Box>
        )
    }
    return documList
}

export function genCurlCommands(url) {

    const curlPrefix =
        `curl -X POST "`
    let saasUrl =
        `https://<tenant>.live.dynatrace.com/`
    let managedUrl =
        `https://<managed_domain>/e/<environment>/`
    const expirationDateOneDay =
        `"now+1d"`
    const curlPartTwo =
        `api/v2/apiTokens" -H "accept: application/json; charset=utf-8" -H "Content-Type: application/json; charset=utf-8" -d `
    const curlObjectStart =
        `{"name":"Dynatrace Config Manager (Write)", "expirationDate": ${expirationDateOneDay},"scopes":[`
    const curlObjectEnd =
        `]}`
    const urlSuffix =
        ` -H "Authorization: Api-Token XXXXXXXX"`
    const readTokenValue =
        `"entities.read","networkZones.read","settings.read","slo.read","credentialVault.read","DataExport","ReadConfig"`
    const writeTokenValue =
        `"networkZones.write","settings.write","slo.write","CaptureRequestData","credentialVault.write","ExternalSyntheticIntegration","WriteConfig"`

    const curlReadObject = JSON.stringify(`${curlObjectStart}${readTokenValue}${curlObjectEnd}`)

    const curlWarning = `- Don't forget to validate the URL and replace "Api-Token XXXXXXXX"`

    let curlRead =
        `${curlWarning}
SaaS tenant:
${curlPrefix}${saasUrl}${curlPartTwo}${curlReadObject}${urlSuffix}
Managed tenant:
${curlPrefix}${managedUrl}${curlPartTwo}${curlReadObject}${urlSuffix}`



    const curlWriteObject = JSON.stringify(`${curlObjectStart}${readTokenValue},${writeTokenValue}${curlObjectEnd}`)

    let curlWrite =
        `${curlWarning}
SaaS tenant:
${curlPrefix}${saasUrl}${curlPartTwo}${curlWriteObject}${urlSuffix}
Managed tenant:
${curlPrefix}${managedUrl}${curlPartTwo}${curlWriteObject}${urlSuffix}`

    if (url === undefined || url === "") {
        // pass
    } else {
        curlRead =
            `${curlWarning}
${curlPrefix}${url}${curlPartTwo}${curlReadObject}${urlSuffix}`
        curlWrite =
            `${curlWarning}
${curlPrefix}${url}${curlPartTwo}${curlWriteObject}${urlSuffix}`
    }

    return [curlRead, curlWrite]
}

// <Link href="https://www.dynatrace.com/support/help/dynatrace-api/environment-api/log-monitoring-v2/post-ingest-logs" target="_blank" rel=" noopener noreferrer">Dynatrace Log Ingestion Api v2</Link>