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
import { useExecutionOptionsState } from '../context/ExecutionContext';
import { Box, Button, Grid, Typography } from '@mui/material';

export function FirstTimeUser({ autoShowed = true, showNextTab = () => { } }) {
  const { firstTimeUser, setFirstTimeUser, setAdvancedMode } = useExecutionOptionsState()

  const handleChangeAdvancedMode = React.useCallback((advancedMode) => {
    if (firstTimeUser !== false) {
      setFirstTimeUser(false)
    }
    setAdvancedMode(advancedMode)
  }, [firstTimeUser, setFirstTimeUser, setAdvancedMode])

  const [advancedLabel, advancedFunction] = React.useMemo(() => {
    if (autoShowed === true) {
      return ["Advanced", () => { handleChangeAdvancedMode(true) }]
    } else {
      return ["Continue", () => { showNextTab() }]
    }

  }, [autoShowed, handleChangeAdvancedMode, showNextTab])

  return (
    <React.Fragment>
      <Box sx={{ ml: 4, }}>
        {autoShowed ?
          <Box sx={{ mt: 4 }}>
            <Typography variant='h3'>
              Welcome to the Dynatrace Config Manager
            </Typography>

            <Box sx={{ mt: 4, mb: 4 }} />
            <Typography align="left">
              It seems to be your first time using the tool.
              <br />
            </Typography>
          </Box>
          : null
        }

        <Typography align="left">
          <br /> Two modes are available:
        </Typography>
        <Typography sx={{ ml: 2 }} align="left">
          - <b>Assisted</b>: the execution is streamlined.
          <br /> - <b>Advanced</b>: you get more control, at the cost of complexity.
        </Typography>


        <Grid item xs={3}></Grid>
        <Box />
        <Box sx={{ mt: 2, mb: 2 }} />
        <Button sx={{ mx: 2 }} {...genMatrixButtonProps(MatrixBlue)} onClick={() => { handleChangeAdvancedMode(false) }}>Assisted</Button>
        <Button sx={{ mx: 2 }} {...genMatrixButtonProps(MatrixRed)} onClick={advancedFunction}>{advancedLabel}</Button>

      </Box>
    </React.Fragment >
  );
}

export const MatrixBlue = "#00FFFF"
export const MatrixRed = "#FF0000"
export const MatrixDisabled = "WhiteSmoke"

export function genMatrixButtonProps(backgroundColor) {

  let textColor = "black"
  if (backgroundColor === MatrixRed || backgroundColor === "white") {
    textColor = "white"
  }

  const style = {
    borderRadius: 50,
    padding: '10px 60px',
    backgroundColor: backgroundColor,
    color: textColor,
  };

  return {
    variant: "contained",
    style: style
  }
}