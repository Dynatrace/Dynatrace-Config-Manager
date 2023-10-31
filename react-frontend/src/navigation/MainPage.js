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
import { UserPage } from './UserPage';
import { FirstTimeUser } from '../options/FirstTimeUser';
import { useTenant } from '../context/TenantListContext';

export function MainPage(props) {
  const { firstTimeUser, setFirstTimeUser, setAdvancedMode } = useExecutionOptionsState()
  const { tenant: { url, APIKey, label } } = useTenant("0")

  const isFirstTimeUser = React.useMemo(() => {
    const environment = process.env.REACT_APP_ENVIRONMENT;

    if (firstTimeUser) {
      if (environment === "test" || (url === "" && APIKey === "" && label === "")) {
        return firstTimeUser
      } else {
        if (firstTimeUser !== false) {
          setFirstTimeUser(false)
          setAdvancedMode(true)
        }
        return false
      }
    }
    return firstTimeUser

  }, [url, APIKey, label, firstTimeUser, setFirstTimeUser, setAdvancedMode])

  return (
    <React.Fragment>
      {isFirstTimeUser ? <FirstTimeUser /> : <UserPage />}
    </React.Fragment>
  );
}