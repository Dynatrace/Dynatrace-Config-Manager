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

import './App.css';
import React from 'react';
import ContextMenu from './menu/ContextMenu';
import AppContextLoad from './context/components/AppContextLoad';
import AppContext from './context/components/AppContext';
import { MainPage } from './navigation/MainPage';
//"@dynatrace/openkit-js": "^1.3.0",     <-- package.json
//import './dynatrace/openkit';

function App() {
  return (
    <React.Fragment>
      <AppContext>
        <AppContextLoad>
          <ContextMenu>
            <MainPage />
          </ContextMenu>
        </AppContextLoad>
      </AppContext>
    </React.Fragment>
  );
}

export default App;
