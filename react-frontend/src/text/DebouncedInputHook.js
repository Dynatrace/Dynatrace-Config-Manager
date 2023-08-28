import * as React from 'react'
import _ from 'lodash';
import { TextField } from '@mui/material';

export const useDebouncedTextField = (defaultText = "") => {
    const [text, setText] = React.useState(defaultText)
    const [textInput, setTextInput] = React.useState(defaultText)

    const debouncedSetText = React.useMemo(() => _.debounce((input) => {
        setText(input)
    }, 500), [])


    const changeTextInput = React.useCallback((newText) => {
        setTextInput(newText)
        debouncedSetText(newText)
    }, [setTextInput, debouncedSetText])

    const handleChangeTextInput = React.useCallback((event) => {
        changeTextInput(event.target.value)
    }, [changeTextInput])

    const debouncedTextField = React.useMemo(() => {
        return (
            <TextField id="search-text-field" variant="standard"
                label="Filter Results" value={textInput} onChange={handleChangeTextInput} />
        )
    }, [textInput, handleChangeTextInput])

    return { text, debouncedTextField, changeTextInput }
}