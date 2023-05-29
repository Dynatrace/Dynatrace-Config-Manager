import * as React from 'react';
import { useMigrationResultHook } from '../result/ResultHook';
import MigrateButtonUncontrolled from './MigrateButtonUncontrolled';
import { Box, FormControl, Grid, IconButton, TextField, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

export default function MigrateEntities() {

    const [searchTextInput, setSearchTextInput] = React.useState("")
    const [searchText, setSearchText] = React.useState("")
    const { setExtractedData, hasExtractedData, resultComponents } = useMigrationResultHook(searchText)

    const handleSetExtractedData = React.useCallback((data) => {
        setSearchText(searchTextInput)
        setExtractedData(data)
    }, [setExtractedData, setSearchText, searchTextInput])

    const handleClearSearchText = React.useCallback(() => {
        setSearchTextInput("");
    }, [setSearchTextInput])

    const searchComponents = React.useMemo(() => {
        let components = []

        components.push(
            <Box sx={{ mt: 2 }}>
                <Typography>Search for schemaId, entityId or key_id:</Typography>
                <Box sx={{ ml: 2 }}>
                    <Grid container>
                        <Grid item xs={5}>
                            <FormControl fullWidth>
                                <TextField id={"search-field"} variant="standard"
                                    label="searchText" value={searchTextInput} onChange={(event) => {
                                        setSearchTextInput(event.target.value)
                                    }} />
                            </FormControl>
                        </Grid>
                        <Grid item xs={1}>
                            <IconButton onClick={handleClearSearchText}>
                                <ClearIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        )

        return components
    }, [searchTextInput, handleClearSearchText])

    const migrateButtonComponent = React.useMemo(() => {
        let label = "Show differences based on current cached files, See Post-Process on the Extract tab (Terraform cli)"
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