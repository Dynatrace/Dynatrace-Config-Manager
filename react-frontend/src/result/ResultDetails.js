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

import * as React from 'react';
import { useMemo } from "react"
import { useResult } from '../context/ResultContext';
import ResultDrawerDetailsAll from './ResultDrawerDetailsAll';
import { useGenTerraformActionComponent, useHandleTerraformCallComplete } from './ResultDetailsHooks';

export default function ResultDetails({ resultKey, setExtractedData }) {
    const { result } = useResult(resultKey)
    const [actionCompleted, setActionCompleted] = React.useState({})
    
    const handleTerraformCallComplete = useHandleTerraformCallComplete(actionCompleted, setActionCompleted, setExtractedData)
    const [lastActionId, setLastActionId] = React.useState({})
    const genTerraformActionComponent = useGenTerraformActionComponent(actionCompleted, handleTerraformCallComplete, lastActionId, setLastActionId)

    const detailsComponent = useMemo(() => {

        if (result) {
            return (
                <ResultDrawerDetailsAll genTerraformActionComponent={genTerraformActionComponent} />
            )
        }

        return null

    }, [result, genTerraformActionComponent])

    return (
        detailsComponent
    )
}
