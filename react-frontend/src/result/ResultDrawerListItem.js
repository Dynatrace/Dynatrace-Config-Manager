import * as React from 'react'
import { Checkbox, FormControl, FormControlLabel } from '@mui/material'

export default function ResultDrawerListItem({ childKey, child, handleToggleList }) {

    const [checked, setChecked] = React.useState("")

    const checkedRef = React.useRef("");
    React.useEffect(() => {
        if (checkedRef.current !== checked) {
            const toggleOn = checkedRef.current === ""
            checkedRef.current = checked
            handleToggleList(childKey, toggleOn)
        }
    }, [childKey, checked, handleToggleList])

    const component = React.useMemo(() => {


        // const labelId = `checkbox-list-label-${childKey}`;
        let childName = child['key_id']
        childName += '( status: ' + child['status'] + ' )'

        const handleToggle = (childKey) => {
            if (checked === "") {
                setChecked(childKey)
            } else {
                setChecked("")
            }
        }
        return (

            <React.Fragment>
                <FormControl fullWidth>
                    <FormControlLabel control={<Checkbox checked={checked !== ""}
                        onChange={() => { handleToggle(childKey) }} />} label={childName} />
                </FormControl>
            </React.Fragment>
        )

    }, [checked, childKey, child])



    return component
}