import * as React from 'react'
import _ from 'lodash';
import { TextField } from '@mui/material';

export const useDebouncedTextField = (defaultText = "") => {
    const [text, setText] = React.useState(defaultText)
    const [textInput, setTextInput] = React.useState(defaultText)

    const debouncedSetText = React.useMemo(() => _.debounce((input) => {
        setText(input)
    }, 500), [])


    const handleChangeTextInput = React.useMemo(() => {
        return (event) => {
            setTextInput(event.target.value)
            debouncedSetText(event.target.value)
        }
    }, [setTextInput, debouncedSetText])

    const debouncedTextField = React.useMemo(() => {
        return (
            <TextField id="search-text-field" variant="standard"
                label="Filter Results" value={textInput} onChange={handleChangeTextInput} />
        )
    }, [textInput, handleChangeTextInput])

    return { text, debouncedTextField }
}