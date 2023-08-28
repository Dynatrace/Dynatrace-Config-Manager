import * as React from 'react'
import { Checkbox, FormControl, FormControlLabel } from '@mui/material'
import { STATUS_COLORS, STATUS_PREFIX } from '../extraction/HorizontalStackedBar';

export default function ResultDrawerListItem({ childKey, child, handleToggleList, forceCheck, forceUncheck }) {

    const [checked, setChecked] = React.useState("")
    const [wasForceChecked, setWasForceChecked] = React.useState(false)

    const checkedRef = React.useRef("");

    const isChecked = React.useMemo(() => {
        return checked !== ""
    }, [checked])

    React.useEffect(() => {
        if (forceCheck || forceUncheck) {
            return
        }
        if (checkedRef.current !== checked) {
            const toggleOn = checkedRef.current === ""
            checkedRef.current = checked
            handleToggleList(childKey, toggleOn)
        }
    }, [childKey, checked, handleToggleList, forceCheck, forceUncheck])



    React.useEffect(() => {
        if (forceCheck) {
            if (wasForceChecked) {
                // pass
            } else {
                setWasForceChecked(true)
            }
        } else if (wasForceChecked) {
            setWasForceChecked(false)
            if (isChecked) {
                setChecked("")
            }
        }
        if (isChecked) {
            if (forceUncheck) {
                setChecked("")
            }
        } else {
            if (forceCheck) {
                setChecked(childKey)
            }
        }
    }, [childKey, forceCheck, forceUncheck, isChecked, wasForceChecked])

    const component = React.useMemo(() => {

        const { key_id, status } = child
        // const labelId = `checkbox-list-label-${childKey}`;
        let childName = STATUS_PREFIX[status] + " " + key_id
        childName += ' ( status: ' + child['status'] + ' )'

        const handleToggle = (childKey) => {
            if (isChecked) {
                setChecked("")
            } else {
                setChecked(childKey)
            }
        }
        return (

            <React.Fragment>
                <FormControl sx={{ color: STATUS_COLORS[status] }} fullWidth>
                    <FormControlLabel control={<Checkbox checked={checked !== ""}
                        onChange={() => { handleToggle(childKey) }} />} label={childName} disabled={forceCheck || forceUncheck} />
                </FormControl>
            </React.Fragment>
        )

    }, [checked, childKey, child, isChecked, forceCheck, forceUncheck])



    return component
}