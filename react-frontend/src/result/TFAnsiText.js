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

import { Box, Button, FormControl, Grid, TextField } from '@mui/material';
import Ansi from 'ansi-to-react';
import * as React from 'react';
import { useDebouncedTextField } from '../text/DebouncedInputHook';

const DEFAULT_MAX_LINES = 35;
const DEFAULT_MAX_LINES_SINGLE_PAGE = 100;
const MIN_LINES = 5;

export default function TFAnsiText({ logList }) {

    const { text: searchText, debouncedTextField, changeTextInput: changeSearchTextInput } = useDebouncedTextField("")
    const [maxLines, setMaxLines] = React.useState(DEFAULT_MAX_LINES)
    const [page, setPage] = React.useState(1)
    const [highlightLine, setHighlightLine] = React.useState(0)
    React.useEffect(() => {
        if(maxLines === DEFAULT_MAX_LINES && logList.length <= DEFAULT_MAX_LINES_SINGLE_PAGE) {
            setMaxLines(DEFAULT_MAX_LINES_SINGLE_PAGE)
        }
    }, [logList])
    const lastPage = React.useMemo(() => {
        if (logList && logList.length) {
            // pass
        } else {
            return 1
        }
        const newLastPage = Math.ceil(logList.length / maxLines)

        setPage(newLastPage)

        return newLastPage
    }, [logList, maxLines, setPage])


    const handleChangeMaxLines = React.useCallback((event) => {
        let newValue = event.target.value
        if (newValue < MIN_LINES) {
            newValue = MIN_LINES
        }
        setMaxLines(newValue)
    }, [setMaxLines])

    const changePage = React.useCallback((newValue) => {
        if (newValue > lastPage) {
            newValue = lastPage
        }
        if (newValue < 1) {
            newValue = 1
        }

        setPage(newValue)
    }, [setPage, lastPage])

    const handleChangePage = React.useCallback((event) => {
        changePage(event.target.value)
    }, [changePage])


    const changePageToLine = React.useCallback((lineNumber) => {
        let newPage = Math.floor(100 * (((lineNumber - 5) / maxLines) + 1)) / 100
        changePage(newPage)
        changeSearchTextInput("")
    }, [changePage, maxLines, changeSearchTextInput])

    const ansiLines = React.useMemo(() => {

        let ansiLines = []
        let missingAnsiLines = []

        if (logList) {
            let startLine = Math.floor((page - 1) * maxLines)
            if (startLine > logList.length) {
                startLine = logList.length - 1
            }

            console.log(page, startLine)
            for (let i = startLine; (i < logList.length && ansiLines.length < maxLines); i++) {
                processLog(logList[i], (i + 1), searchText, ansiLines, changePageToLine, highlightLine, setHighlightLine);
            }

            for (let i = (startLine - 1); (i >= 0 && (ansiLines.length + missingAnsiLines.length) < maxLines); i--) {
                processLog(logList[i], (i + 1), searchText, missingAnsiLines, changePageToLine, highlightLine, setHighlightLine);
            }

        }

        return missingAnsiLines.reverse().concat(ansiLines)
    }, [logList, maxLines, searchText, page, changePageToLine, highlightLine, setHighlightLine])

    return (
        <React.Fragment>
            <Grid container>
                <Grid item xs={1}></Grid>
                <Grid item xs={11}>
                    {debouncedTextField}
                    <React.Fragment>
                        <FormControl>
                            <TextField id={"ansi_page"}
                                type="number"
                                variant="standard"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                label="From Page" value={page}
                                onChange={handleChangePage} />
                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <FormControl>
                            <TextField id={"max_page"}
                                type="number"
                                variant="standard"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                disabled
                                label="Last Page" value={lastPage} />

                        </FormControl>
                    </React.Fragment>
                    <React.Fragment>
                        <FormControl>
                            <TextField id={"ansi_max_lines"}
                                type="number"
                                variant="standard"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                label="Lines Per Page" value={maxLines}
                                onChange={handleChangeMaxLines} />
                        </FormControl>
                    </React.Fragment>
                </Grid>
            </Grid>
            <Grid container>
                {ansiLines}
            </Grid>
        </React.Fragment>
    )
}

function processLog(moduleLine, lineNumber, searchText, ansiLines, changePageToLine, highlightLine, setHighlightLine) {
    let lineComponent = null
    if (searchText === "") {
        if (lineNumber === highlightLine) {
            lineComponent = (
                <React.Fragment>
                    <b>{lineNumber}</b>
                </React.Fragment>
            )

        } else {
            lineComponent = (
                <React.Fragment>
                    {lineNumber}
                </React.Fragment>
            )

        }
    } else {
        lineComponent = (
            <Button onClick={() => { changePageToLine(lineNumber); setHighlightLine(lineNumber) }}>{lineNumber}</Button>
        )
    }

    let textComponent = null
    if (searchText === "" && moduleLine === "\n") {
        textComponent = (
            <span><br /></span>
        )
    } else if (searchText === "" || moduleLine.includes(searchText)) {
        const leadingSpaces = countLeadingSpaces(moduleLine);
        textComponent = (
            <Box sx={{ ml: leadingSpaces, my: 0 }}>
                <Ansi>{moduleLine}</Ansi>
            </Box>
        )
    }
    if (textComponent) {
        ansiLines.push(
            <React.Fragment>
                <Grid item xs={1}>
                    {lineComponent}
                </Grid>
                <Grid item xs={11}>
                    {textComponent}
                </Grid>
            </React.Fragment>
        );
    }
}

function countLeadingSpaces(moduleLine) {
    return stripAnsiCodes(moduleLine).search(leadingSpacesRegex) / 2
}

function stripAnsiCodes(moduleLine) {
    if(moduleLine) {
        return moduleLine.replace(ansiCodeRegex, '')
    } else {
        return ""
    }
}

const ansiCodeRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1, 4}(?:;[0-9]{0, 4})*)?[0-9A-ORZcf-nqry=><]/g
const leadingSpacesRegex = /\S|$/