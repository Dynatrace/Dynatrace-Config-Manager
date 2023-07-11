import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { drawerBleeding } from '../result/ResultDrawer';
import { TabPanel } from './TabPanel';


export const genTabConfig = (tabLabel, tabComponent) => {
  return { tabLabel, tabComponent }
}

export default function TabPanelBar({tabConfig}) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [tabs, tabPanels] = React.useMemo(() => {
    const outTabs = []
    const outTabPanels = []

    tabConfig.forEach((tabConfig, index) => {
      const { tabLabel, tabComponent } = tabConfig
      outTabs.push(
        (
          <Tab label={tabLabel} key={"tab-" + index} id={`tab-${index}`} />
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
  }, [value, tabConfig])

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
