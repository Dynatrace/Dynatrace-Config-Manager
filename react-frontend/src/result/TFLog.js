import { Box, Paper } from '@mui/material';
import Ansi from 'ansi-to-react';
import * as React from 'react';
import EfficientAccordion from './EfficientAccordion';


export default function TFLog({ logs, actionLabel, actionId }) {
    return (
        <Paper sx={{ ml: 3, mt: 2 }}>
            <EfficientAccordion
                label={"Terraform Log for " + actionLabel + ", based on action_" + actionId}
                labelColor="secondary.dark"
                labelVariant="h6"
                defaultExpanded={false}
                componentList={
                    logs.split("\n").map(function (line) {

                        const leadingSpaces = stripAnsiCodes(line).search(/\S|$/) / 2

                        return (
                            <React.Fragment>
                                <Box sx={{ ml: leadingSpaces, my: 0 }}>
                                    <Ansi>{line}</Ansi>
                                </Box>
                            </React.Fragment>
                        )
                    })
                }
            />
        </Paper>
    )
}

const stripAnsiCodes = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1, 4}(?:;[0-9]{0, 4})*)?[0-9A-ORZcf-nqry=><]/g, '');
