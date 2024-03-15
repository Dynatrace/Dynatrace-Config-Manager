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
import { EXTRACT_CONFIGS, GET_FINISHED_DOWNLOAD_CONFIGS } from '../backend/backend';
import ExtractButton from './ExtractButton';
import { Grid } from '@mui/material';
import ExtractionInfo from './ExtractionInfo';

export default function ExtractConfigs({ tenantKeyType, setCacheDetails, subProgress, setSubProgress }) {

    return (
        <React.Fragment>
            <Grid container direction={'row'} alignItems={'center'} >
                <Grid item>
                    <ExtractButton api={EXTRACT_CONFIGS}
                        label="Extract Configs"
                        tenantKeyType={tenantKeyType}
                        setSubProgress={setSubProgress} />
                </Grid>
                <Grid item>
                    <ExtractionInfo api={GET_FINISHED_DOWNLOAD_CONFIGS} tenantKeyType={tenantKeyType} extractionProgress={subProgress} setCacheDetails={setCacheDetails} />
                </Grid>
            </Grid>
        </React.Fragment>
    );
}
