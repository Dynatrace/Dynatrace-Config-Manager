import { Link, Typography } from '@mui/material';
import * as React from 'react';

const documText =
`
This is a placeholder
`

export default function DocumPanel() {

    const documList = React.useMemo(() => {
        let documList = []
        const documLines = documText.split('\n')
        for (const documLine of Object.values(documLines)) {
            documList.push(<Typography display="block" style={{ wordWrap: "break-word" }} sx={{ mt: 0.5 }}>{documLine}</Typography>)
        }
        return documList

    }, [])

    return (
        <React.Fragment>
            {documList}
        </React.Fragment>
    );
}

// <Link href="https://www.dynatrace.com/support/help/dynatrace-api/environment-api/log-monitoring-v2/post-ingest-logs" target="_blank" rel=" noopener noreferrer">Dynatrace Log Ingestion Api v2</Link>