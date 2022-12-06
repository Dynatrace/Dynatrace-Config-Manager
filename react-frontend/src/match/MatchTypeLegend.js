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
