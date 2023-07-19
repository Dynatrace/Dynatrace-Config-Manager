import './App.css';
import React from 'react';
import ContextMenu from './menu/ContextMenu';
import TabPanelMain from './navigation/TabPanelMain';
import AppContextLoad from './context/components/AppContextLoad';
import AppContext from './context/components/AppContext';
//"@dynatrace/openkit-js": "^1.3.0",     <-- package.json
//import './dynatrace/openkit';

function App() {
  return (
    <React.Fragment>
      <AppContext>
        <AppContextLoad>
          <ContextMenu>
            <TabPanelMain />
          </ContextMenu>
        </AppContextLoad>
      </AppContext>
    </React.Fragment>
  );
}

export default App;
