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

import * as React from 'react'
import { Checkbox, FormControl, FormControlLabel } from '@mui/material'
import { STATUS_COLORS, STATUS_PREFIX } from '../extraction/HorizontalStackedBar';

export default function ResultDrawerListItem({ childKey, child, handleToggleList, forceCheck, forceUncheckValue, allChecked, disabled }) {

    const [checked, setChecked] = React.useState("")
    const [wasForceChecked, setWasForceChecked] = React.useState(false)

    const checkedRef = React.useRef("");

    React.useEffect(() => {
        if (allChecked.includes(childKey)) {
            setChecked(childKey)
        }
    }, [])

    const isChecked = React.useMemo(() => {
        return checked !== ""
    }, [checked])

    React.useEffect(() => {
        if (forceCheck || forceUncheckValue !== "") {
            return
        }
        if (checkedRef.current !== checked) {
            const toggleOn = checkedRef.current === ""
            checkedRef.current = checked
            handleToggleList(childKey, toggleOn)
        }
    }, [childKey, checked, handleToggleList, forceCheck, forceUncheckValue])

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
            if (forceUncheckValue !== "") {
                setChecked("")
            }
        } else {
            if (forceCheck) {
                setChecked(childKey)
            }
        }
    }, [childKey, forceCheck, forceUncheckValue, wasForceChecked])

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
                        onChange={() => { handleToggle(childKey) }} />} label={childName} disabled={disabled} />
                </FormControl>
            </React.Fragment>
        )

    }, [checked, childKey, child, isChecked, disabled])



    return component
}