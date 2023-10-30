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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { drawerBleeding } from '../result/ResultDrawer';
import { TabPanel } from './TabPanel';


export const genTabConfig = (tabLabel, tabComponent) => {
  return { tabLabel, tabComponent }
}

export default function TabPanelBar({ tabConfig, tabIdx: tabIdxReq, setTabIdx, autoDisable = false }) {

  const tabIdx = React.useMemo(() => {
    if (tabIdxReq >= tabConfig.length) {
      return tabConfig.length - 1
    } else if (tabIdxReq < 0) {
      return 0
    }
    return tabIdxReq
  }, [tabIdxReq, tabConfig])

  const handleChange = React.useCallback((event, newValue) => {
    setTabIdx(newValue)
  }, [setTabIdx])

  const [tabs, tabPanels] = React.useMemo(() => {
    const outTabs = []
    const outTabPanels = []

    tabConfig.forEach((tabConfig, index) => {
      const { tabLabel, tabComponent } = tabConfig
      outTabs.push(
        (
          <Tab label={tabLabel} key={"tab-" + index} id={`tab-${index}`} disabled={index > tabIdx && autoDisable} />
        ))
      outTabPanels.push(
        (
          <TabPanel value={tabIdx} index={index} key={"tab-panel-" + index}>
            {tabComponent}
            <Box sx={{ my: drawerBleeding }} />
          </TabPanel>
        ))

    })

    return [outTabs, outTabPanels]
  }, [tabIdx, tabConfig, autoDisable])

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={handleChange} aria-label="basic tabs example">
          {tabs}
        </Tabs>
      </Box>
      {tabPanels}
    </Box>
  );
}
