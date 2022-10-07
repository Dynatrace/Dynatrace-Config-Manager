import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useEntityFilter, useEntityFilterKey, useEntityFilterList } from '../context/EntityFilterContext';
import { Box, Button, Paper } from '@mui/material';

export default function EntityFilterSelector() {

    const { entityFilterKey, setEntityFilterKey } = useEntityFilterKey()
    const { entityFilter } = useEntityFilter(entityFilterKey)
    const { entityFilterList } = useEntityFilterList()

    const handleChangeEntityFilterKey = React.useMemo(() => {
        return (event) => {
            setEntityFilterKey(event.target.value);
        }
    }, [setEntityFilterKey])

    const entityFilterItems = React.useMemo(() => {
        const entityFilterItemList = []
        entityFilterList.forEach((entityFilter, index) => {
            entityFilterItemList.push(
                genEntityFilterItem(entityFilter)
            )
        })
        return entityFilterItemList
    }, [entityFilterList])

    const selector = React.useMemo(() => {
        return (

            <Select
                labelId="entityFilter-select-labell"
                id="entityFilter-select"
                value={entityFilterKey}
                label="Entity Filter"
                onChange={handleChangeEntityFilterKey}
            >
                {entityFilterItems}
            </Select>
        )
    }, [entityFilterKey, entityFilterItems, handleChangeEntityFilterKey])

    const linkToEntityFilterUI = React.useMemo(() => {
        if (entityFilter && entityFilter.url && entityFilter.url !== "") {
            return (
                <Box>
                    <Button href={entityFilter ? entityFilter.url : ""} target="_blank" rel=" noopener noreferrer">
                        Go To EntityFilter UI
                    </Button>
                </Box >
            )
        } else {
            return null
        }
    }, [entityFilter])

    return (
        <Paper>
            <FormControl fullWidth>
                <InputLabel id="entityFilter-select-label">EntityFilter</InputLabel>
                {selector}
            </FormControl>
            {linkToEntityFilterUI}
        </Paper>
    )
}

const genEntityFilterItem = (entityFilter) => {
    let label = entityFilter.label
    if (!label || label === "") {
        label = "New EntityFilter"
    }
    let url = entityFilter.url

    if (url && entityFilter.url !== "") {
        url = " ( " + url + " ) "
    } else {
        url = ""
    }
    label = entityFilter.key + ": " + label + url
    return (
        <MenuItem value={entityFilter.key} key={"menuItem" + entityFilter.key}>{label}</MenuItem>
    )
}