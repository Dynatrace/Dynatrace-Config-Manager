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
