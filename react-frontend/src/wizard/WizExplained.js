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

import { Box, Button, Typography } from '@mui/material';
import * as React from 'react';
import { MatrixBlue, MatrixRed, genMatrixButtonProps } from '../options/FirstTimeUser';
import { useExecutionOptionsState } from '../context/ExecutionContext';

export function WizExplained({ showNextTab }) {

  const { setAdvancedMode, setFirstTimeUser } = useExecutionOptionsState()

  const handleChangeAdvancedMode = (advancedMode) => {
    setAdvancedMode(advancedMode)
  }
  const handleChangeFirstTimeUser = (firstTimeUser) => {
    setFirstTimeUser(firstTimeUser)
  }

  const environment = process.env.REACT_APP_ENVIRONMENT;

  return (
    <React.Fragment>
      <Box sx={{ ml: 4 }}>

        <Typography variant='h6'>
          Assisted mode purpose:
        </Typography>
        <Typography sx={{ ml: 2 }}>
          - A faster, more streamlined way of using the tool.
          <br /> - If you need more control, switch to advanced.
        </Typography>
        <Button sx={{ mx: 2, mt: 4 }} {...genMatrixButtonProps(MatrixBlue)} onClick={showNextTab}>Continue</Button>
        <Button sx={{ mx: 2, mt: 4 }} {...genMatrixButtonProps(MatrixRed)} onClick={() => { handleChangeAdvancedMode(true) }}>Switch to Advanced</Button>
        {environment !== "test" ? 
        null
        : <Button sx={{ mx: 2, mt: 4 }} {...genMatrixButtonProps("white")} disableElevation disableFocusRipple disableRipple onClick={() => { handleChangeFirstTimeUser(true) }}>Switch to First Time User (Dev only)</Button>
        }
      </Box>

    </React.Fragment>
  );
}
