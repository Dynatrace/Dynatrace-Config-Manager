import { Box, Link, Typography } from '@mui/material';
import * as React from 'react';

const section1 =
    `
Here is a list of the required scopes for your access token:

Read Scopes:
- Read entities
- Read settings
- Read SLO
- Access problem and event feed, metrics, and topology
- Read configuration

`

const section2 =
    `

Write Scopes (in addition to the read scopes):
- Write settings
- Write SLO
- Create and read synthetic monitors, locations, and nodes
- Write configuration

`

const curlRead =
    `
Curl for SaaS tenant:
curl -X POST "https://<tenant>.live.dynatrace.com/api/v2/apiTokens" -H "accept: application/json; charset=utf-8" -H "Content-Type: application/json; charset=utf-8" -d "{\"scopes\":[\"entities.read\",\"settings.read\",\"slo.read\",\"DataExport\",\"ReadConfig\"],\"name\":\"Dynatrace Config Manager (Read)\"}" -H "Authorization: Api-Token XXXXXXXX"
Curl for Managed tenant:
curl -X POST "https://<managed_domain>/e/<environment>/api/v2/apiTokens" -H "accept: application/json; charset=utf-8" -H "Content-Type: application/json; charset=utf-8" -d "{\"scopes\":[\"entities.read\",\"settings.read\",\"slo.read\",\"DataExport\",\"ReadConfig\"],\"name\":\"Dynatrace Config Manager (Read)\"}" -H "Authorization: Api-Token XXXXXXXX"
`

const curlWrite =
    `
Curl for SaaS tenant:
curl -X POST "https://<tenant>.live.dynatrace.com/api/v2/apiTokens" -H "accept: application/json; charset=utf-8" -H "Content-Type: application/json; charset=utf-8" -d "{\"scopes\":[\"entities.read\",\"settings.read\",\"settings.write\",\"slo.read\",\"slo.write\",\"DataExport\",\"ExternalSyntheticIntegration\",\"ReadConfig\",\"WriteConfig\"],\"name\":\"Dynatrace Config Manager (Write)\"}" -H "Authorization: Api-Token XXXXXXXX"
Curl for Managed tenant:
curl -X POST "https://<managed_domain>/e/<environment>/api/v2/apiTokens" -H "accept: application/json; charset=utf-8" -H "Content-Type: application/json; charset=utf-8" -d "{\"scopes\":[\"entities.read\",\"settings.read\",\"settings.write\",\"slo.read\",\"slo.write\",\"DataExport\",\"ExternalSyntheticIntegration\",\"ReadConfig\",\"WriteConfig\"],\"name\":\"Dynatrace Config Manager (Write)\"}" -H "Authorization: Api-Token XXXXXXXX"
`

export default function DocumPanel() {

    const documList = React.useMemo(() => {
        let documList = []

        documList.push(<Typography variant='h5'>Access Token (API Key):</Typography>)
        documList.push(...multiLinesToComponent(section1))
        documList.push(...multiLinesToComponent(curlRead))
        documList.push(...multiLinesToComponent(section2))
        documList.push(...multiLinesToComponent(curlWrite))

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