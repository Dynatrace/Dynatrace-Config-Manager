import * as React from 'react';
import { useMemo } from "react"
import { TERRAFORM_APPLY_ALL, TERRAFORM_PLAN_ALL } from '../backend/backend';
import { useHistoryState } from '../context/HistoryContext';

export const ALL = 'All'
const terraformParams = [
    { 'module': ALL, 'module_trimmed': ALL, 'unique_name': ALL }
]

const module = ALL
const resource = ALL
const nbUpdate = 1
const nbUpdateError = 0

export default function ResultDrawerDetailsAll({ genTerraformActionComponent }) {

    const { lastPlanAllActionId, setLastPlanAllActionId } = useHistoryState()

    const terraformComponent = useMemo(() => {
        return genTerraformActionComponent(lastPlanAllActionId, setLastPlanAllActionId, nbUpdate, terraformParams, module, resource, nbUpdateError, TERRAFORM_PLAN_ALL, TERRAFORM_APPLY_ALL)
    }, [genTerraformActionComponent, lastPlanAllActionId, setLastPlanAllActionId])

    return (
        <React.Fragment>
            {terraformComponent}
        </React.Fragment>
    )
}
