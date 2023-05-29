import * as React from 'react';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';
import { Box, FormControl, TextField, Typography } from '@mui/material';

export default function MigrateEntities() {

    const [searchTextInput, setSearchTextInput] = React.useState("")
    const [searchText, setSearchText] = React.useState("")
    const { setExtractedData, hasExtractedData, resultComponents } = useMigrationResultHook(searchText)

    const handleSetExtractedData = React.useCallback((data) => {
        setSearchText(searchTextInput)
        setExtractedData(data)
    }, [setExtractedData, setSearchText, searchTextInput])

    const searchComponents = React.useMemo(() => {
        let components = []

        components.push(
            <Box sx={{ mt: 2 }}>
                <Typography>Search for schemaId, entityId or key_id:</Typography>
                <Box sx={{ ml: 2 }}>
                    <React.Fragment>
                        <FormControl fullWidth>
                            <TextField id={"search-field"} variant="standard"
                                label="searchText" value={searchTextInput} onChange={(event) => {
                                    setSearchTextInput(event.target.value)
                                }} />
                        </FormControl>
                    </React.Fragment>
                </Box>
            </Box>
        )

        return components
    }, [searchTextInput])

    const migrateButtonComponent = React.useMemo(() => {
        let label = "Show differences based on current cached files"
        let confirm = false

        return (
            <MigrateButtonUncontrolled handleChange={handleSetExtractedData} label={label} confirm={confirm} />
        )

    }, [handleSetExtractedData])

    return (
        <React.Fragment>
            {searchComponents}
            {migrateButtonComponent}
            {resultComponents}
        </React.Fragment>
    );
}