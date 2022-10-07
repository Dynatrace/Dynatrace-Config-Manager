import './App.css';
import BasicTabs from './navigation/TabPanel.js';
import AppContext from './context/AppContext';
import React from 'react';
import LoadContext from './context/LoadContext';
//"@dynatrace/openkit-js": "^1.3.0",     <-- package.json
//import './dynatrace/openkit';

function App() {
  return (
    <React.Fragment>
      <AppContext>
        <LoadContext>
            <BasicTabs />
        </LoadContext>
      </AppContext>
    </React.Fragment>
  );
}

export default App;
