import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useEntityFilterKey, useEntityFilterList } from '../context/EntityFilterContext';
import { MenuItem, Paper } from '@mui/material';
import { getEntityFilterLabel } from './useFilterOnLabel';

export default function EntityFilterSelector() {

    const { entityFilterKey, setEntityFilterKey } = useEntityFilterKey()
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

    return (
        <Paper>
            <FormControl fullWidth>
                <InputLabel id="entityFilter-select-label">EntityFilter</InputLabel>
                {selector}
            </FormControl>
        </Paper>
    )
}

const genEntityFilterItem = (entityFilter) => {
    return (
        <MenuItem value={entityFilter.key} key={"menuItem" + entityFilter.key}>{getEntityFilterLabel(entityFilter)}</MenuItem>
    )
}