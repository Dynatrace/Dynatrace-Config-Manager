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
import { useContextMenuState } from "../context/ContextMenuContext"
import { useResult } from '../context/ResultContext';
import ResultDrawerDetailsSchema from './ResultDrawerDetailsSchema';
import { useGenTerraformActionComponent, useHandleTerraformCallComplete } from './ResultDetailsHooks';

export default function ResultDrawerDetails() {

    const { contextNode, setContextNode } = useContextMenuState()
    const resultKey = useContextResultKey(contextNode)
    const { result, setResult: setExtractedData } = useResult(resultKey)
    const [actionCompleted, setActionCompleted] = React.useState({})
    const setExtractedDataNoResetMenu = React.useCallback((value) => {
        setExtractedData({...value, "keepDrawerOpen": true}, false)
    }, [setExtractedData])
    const handleTerraformCallComplete = useHandleTerraformCallComplete(actionCompleted, setActionCompleted, setExtractedDataNoResetMenu)
    const [lastActionsInfo, setLastActionsInfo] = React.useState({})
    const genTerraformActionComponent = useGenTerraformActionComponent(actionCompleted, handleTerraformCallComplete, lastActionsInfo, setLastActionsInfo)

    const detailsComponent = useMemo(() => {

        if (result) {

            const props = { contextNode, setContextNode, result, genTerraformActionComponent }
            return (
                <ResultDrawerDetailsSchema {...props} />
            )
        }

        return null

    }, [contextNode, result, setContextNode, genTerraformActionComponent])

    return (
        detailsComponent
    )
}

export function useContextResultKey(contextNode) {
    return useMemo(() => {
        if (contextNode) {
            return contextNode['resultKey']
        }
        return null
    }, [contextNode])

}
