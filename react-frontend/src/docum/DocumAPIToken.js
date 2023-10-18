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


const accessTokenHygieneInfo =
    `
Access Token hygiene: 
- This tool is not using a Vault to store your access tokens.
- It is recommended that the tokens you create have a 24 hours life span and that you delete them when you are done using the tool.
`

const tokenSection =
    `
Here is a list of the required scopes for your access token
- In addition, you will find curl commands that you can copy paste to create the tokens easily
`

const readScopeSection =
    `

Read Scopes:
- Read entities
- Read settings
- Read SLO
- Access problem and event feed, metrics, and topology
- Read configuration
- Read network zones
- Read Credential Vault

`

const curlPrefix =
    `curl -X POST "`
const saasUrl =
    `https://<tenant>.live.dynatrace.com/`
const managedUrl =
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

const curlRead =
    `
curl for SaaS tenant:
${curlPrefix}${saasUrl}${curlPartTwo}${curlReadObject}${urlSuffix}
Curl for Managed tenant:
${curlPrefix}${managedUrl}${curlPartTwo}${curlReadObject}${urlSuffix}
`

const writeScopeSection =
    `

Write Scopes (in addition to the read scopes):
- Write settings
- Write SLO
- Create and read synthetic monitors, locations, and nodes
- Write configuration
- Write network zones
- Write Credential Vault
- Capture request data

`


const curlWriteObject = JSON.stringify(`${curlObjectStart}${readTokenValue},${writeTokenValue}${curlObjectEnd}`)

const curlWrite =
    `
curl for SaaS tenant:
${curlPrefix}${saasUrl}${curlPartTwo}${curlWriteObject}${urlSuffix}
Curl for Managed tenant:
${curlPrefix}${managedUrl}${curlPartTwo}${curlWriteObject}${urlSuffix}
`

export default function DocumAPIToken() {

    const documList = React.useMemo(() => {
        let documList = []

        documList.push(<Typography variant='h5'>Access Token (API Key):</Typography>)
        documList.push(...multiLinesToComponent(accessTokenHygieneInfo))
        documList.push(...multiLinesToComponent(tokenSection))


        documList.push((<EfficientAccordion
            defaultExpanded={false}
            label="Read Scopes and curls: "
            labelColor={null}
            componentList={[
                ...multiLinesToComponent(readScopeSection),
                ...multiLinesToComponent(curlRead),
            ]
            } />))

        documList.push((<EfficientAccordion
            defaultExpanded={false}
            label="Write Scopes and curls: "
            labelColor={null}
            componentList={[
                ...multiLinesToComponent(writeScopeSection),
                ...multiLinesToComponent(curlWrite),
            ]
            } />))

        return documList

    }, [])

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

// <Link href="https://www.dynatrace.com/support/help/dynatrace-api/environment-api/log-monitoring-v2/post-ingest-logs" target="_blank" rel=" noopener noreferrer">Dynatrace Log Ingestion Api v2</Link>