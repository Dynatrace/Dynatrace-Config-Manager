import './App.css';
import BasicTabs from './navigation/TabPanel.js';
import AppContext from './context/AppContext';
import React from 'react';
import LoadContext from './context/LoadContext';
import ContextMenu from './menu/ContextMenu';
//"@dynatrace/openkit-js": "^1.3.0",     <-- package.json
//import './dynatrace/openkit';

function App() {
  return (
    <React.Fragment>
      <AppContext>
        <LoadContext>
          <ContextMenu>
            <BasicTabs />
          </ContextMenu>
        </LoadContext>
      </AppContext>
    </React.Fragment>
  );
}

export default App;
