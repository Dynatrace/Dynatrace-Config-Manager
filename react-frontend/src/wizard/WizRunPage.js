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
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';
import { WizRun } from './WizRun';
import { useTerraformExecDetails } from '../extraction/useTerraformExecDetails';
import { useOneTopologyExecDetails } from '../extraction/useOneTopologyExecDetails';

export function WizRunPage({ showNextTab }) {


  const { isTerraformError, terraformErrorComponent } = useTerraformExecDetails()
  const { isOneTopologyError, oneTopologyErrorComponent } = useOneTopologyExecDetails()

  return (
    <React.Fragment>
      <MigrateContext>
        <MigrateContextLoad>
          {isTerraformError ? terraformErrorComponent
            : null}
          {isOneTopologyError ? oneTopologyErrorComponent
            : null}
          {!isTerraformError && !isOneTopologyError ? <WizRun showNextTab={showNextTab} />
            : null}
        </MigrateContextLoad>
      </MigrateContext>
    </React.Fragment>
  );
}

