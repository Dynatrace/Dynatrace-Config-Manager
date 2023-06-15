import * as React from 'react';
import { useMemo } from "react"
import { TERRAFORM_APPLY_ALL, TERRAFORM_PLAN_ALL } from '../backend/backend';

const ALL = 'All'
const terraformParams = [
    { 'module': ALL, 'module_trimmed': ALL, 'unique_name': ALL }
]

const actionId = "0"
const module = ALL
const resource = ALL
const nbUpdate = 1
const nbUpdateError = 0

export default function ResultDrawerDetailsAll({ genTerraformActionComponent }) {

    const terraformComponent = useMemo(() => {
        return genTerraformActionComponent(actionId, nbUpdate, terraformParams, module, resource, nbUpdateError, TERRAFORM_PLAN_ALL, TERRAFORM_APPLY_ALL)
    }, [genTerraformActionComponent])

    return (
        <React.Fragment>
            {terraformComponent}
        </React.Fragment>
    )
}
