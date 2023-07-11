import './App.css';
import AppContext from './context/AppContext';
import React from 'react';
import LoadContext from './context/LoadContext';
import ContextMenu from './menu/ContextMenu';
import TabPanelMain from './navigation/TabPanelMain';
//"@dynatrace/openkit-js": "^1.3.0",     <-- package.json
//import './dynatrace/openkit';

function App() {
  return (
    <React.Fragment>
      <AppContext>
        <LoadContext>
          <ContextMenu>
            <TabPanelMain />
          </ContextMenu>
        </LoadContext>
      </AppContext>
    </React.Fragment>
  );
}

export default App;
