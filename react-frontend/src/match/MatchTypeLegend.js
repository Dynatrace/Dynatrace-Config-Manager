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

import { Grid, Paper, Typography } from '@mui/material';
import * as React from 'react';
import { match_type_palettes, match_type_label } from './matchPalette';

export default function MatchTypeLegend() {

    const matchTypeComponents = React.useMemo(() => {
        let matchTypeTypographyList = []

        for (let match_key of Object.keys(match_type_palettes)) {
            matchTypeTypographyList.push(
                <Grid id={match_key} item xs={2}>
                    <Typography sx={{ color: match_type_palettes[match_key] }}>{"" + match_key + ": " + match_type_label[match_key]}</Typography>
                </Grid>
            )
        }

        return matchTypeTypographyList

    }, [])

    return (
        <Paper elevation={0}>
            <Typography sx={{ mt: 1 }}>Match Types:</Typography>
            <Grid container>
                {matchTypeComponents}
            </Grid>
        </Paper>
    );
}
