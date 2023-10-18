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

import { Paper, Typography } from '@mui/material';
import * as React from 'react';
import { MATCH_ENTITIES_V2 } from '../backend/backend';
import { MATCH_TYPE } from '../options/SortOrderOption';
import { useTreeResult } from './AnalysisResultHook';
import MatchButton from './MatchButton';
import MatchTypeLegend from './MatchTypeLegend';

export default function MatchEntities() {

    const { setAnalysisResult, analysisResultComponent } = useTreeResult(MATCH_TYPE)

    return (
        <Paper elevation={0}>
            <MatchButton handleChange={setAnalysisResult} api={MATCH_ENTITIES_V2} label="Match Entities V2" />
            <Typography sx={{ mt: 2 }}>Legend:</Typography>
            <MatchTypeLegend />
            <Paper elevation={0} sx={{ mt: 1 }}>
                {analysisResultComponent}
            </Paper>
        </Paper>
    );
}
