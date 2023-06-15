import { Box } from '@mui/material';
import Ansi from 'ansi-to-react';
import * as React from 'react';

export default function TFAnsiText({ logList }) {

    const ansiLines = React.useMemo(() => {

        let ansiLines = []

        if (logList) {
            for (const moduleLine of Object.values(logList)) {
                const leadingSpaces = countLeadingSpaces(moduleLine)
                ansiLines.push(
                    <Box sx={{ ml: leadingSpaces, my: 0 }}>
                        <Ansi>{moduleLine}</Ansi>
                    </Box>
                )
            }
        }

        return ansiLines
    }, [logList])

    return (
        <React.Fragment>
            {ansiLines}
        </React.Fragment>
    )
}

function countLeadingSpaces(moduleLine) {
    return stripAnsiCodes(moduleLine).search(leadingSpacesRegex) / 2
}

function stripAnsiCodes(moduleLine) {
    return moduleLine.replace(ansiCodeRegex, '')
}

const ansiCodeRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1, 4}(?:;[0-9]{0, 4})*)?[0-9A-ORZcf-nqry=><]/g
const leadingSpacesRegex = /\S|$/