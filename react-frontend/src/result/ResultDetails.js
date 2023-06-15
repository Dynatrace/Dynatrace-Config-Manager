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
