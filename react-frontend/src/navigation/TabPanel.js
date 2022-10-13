import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CredentialPanel from '../credentials/CredentialPanel';
import DocumPanel from '../docum/DocumPanel';
import ExtractionPanel from '../extraction/ExtractionPanel';
import MatchPanel from '../match/MatchPanel';
import Setting from '../setting/Setting';
import MigratePanel from '../migrate/MigratePanel';
import { drawerBleeding } from '../result/ResultDrawer';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const genTabConfig = (tabLabel, tabComponent) => {
  return { tabLabel, tabComponent }
}
const tabConfig = [
  genTabConfig("Credentials", <CredentialPanel />),
  genTabConfig("Extraction", <ExtractionPanel />),
  genTabConfig("Match", <MatchPanel />),
  genTabConfig("Migrate", <MigratePanel />),
  genTabConfig("Settings", <Setting />),
  genTabConfig("Documentation", <DocumPanel />),
]

export default function BasicTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [tabs, tabPanels] = React.useMemo(() => {
    console.log("TABS TABS")
    const outTabs = []
    const outTabPanels = []

    tabConfig.forEach((tabConfig, index) => {
      const { tabLabel, tabComponent } = tabConfig
      outTabs.push(
        (
          <Tab label={tabLabel} key={"tab-" + index} {...a11yProps(index)} />
        ))
        outTabPanels.push(
        (
          <TabPanel value={value} index={index} key={"tab-panel-" + index}>
            {tabComponent}
            <Box sx={{ my: drawerBleeding }} />
          </TabPanel>
        ))

    })

    return [outTabs, outTabPanels]
  }, [value])

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          {tabs}
        </Tabs>
      </Box>
      {tabPanels}
    </Box>
  );
}
