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
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';
import ExtractionSection from './ExtractionSection';

export default function ExtractionPanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateContext>
                <MigrateContextLoad>
                    <ExtractionSection />
                </MigrateContextLoad>
            </MigrateContext>
        </React.Fragment>
    );
}
