import * as React from 'react';
import { useMemo } from "react"
import { useContextMenuState } from "../context/ContextMenuContext"
import { useResult } from '../context/ResultContext';
import ResultDrawerDetailsSchema from './ResultDrawerDetailsSchema';
import { useGenTerraformActionComponent, useHandleTerraformCallComplete } from './ResultDetailsHooks';

export default function ResultDrawerDetails() {

    const { contextNode, setContextNode } = useContextMenuState()
    const resultKey = useContextResultKey(contextNode)
    const { result } = useResult(resultKey)
    const [actionCompleted, setActionCompleted] = React.useState({})
    const handleTerraformCallComplete = useHandleTerraformCallComplete(actionCompleted, setActionCompleted)
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

function useContextResultKey(contextNode) {
    return useMemo(() => {
        if (contextNode) {
            return contextNode['resultKey']
        }
        return null
    }, [contextNode])

}
