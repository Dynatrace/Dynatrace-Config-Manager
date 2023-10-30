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
import TabPanelBar, { genTabConfig } from './TabPanelBar';
import { WizExplained } from '../wizard/WizExplained';
import { WizTenantConfig } from '../wizard/WizTenantConfig';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET } from '../context/TenantListContext';
import { WizRunPage } from '../wizard/WizRunPage';



export default function TabPanelAssisted({ tabIdx, setTabIdx }) {

  const genShowNextTab = React.useCallback((currentIdx) => {
    return () => {
      setTabIdx(currentIdx + 1)
    }
  }, [setTabIdx])

  const tabConfig = React.useMemo(() => {
    const tabConfigList = []

    tabConfigList.push(
      genTabConfig("Mode", <WizExplained key="WizExplained" showNextTab={genShowNextTab(tabConfigList.length)} />))
    tabConfigList.push(
      genTabConfig("Source", <WizTenantConfig key="WizTenantConfigMain" showNextTab={genShowNextTab(tabConfigList.length)}
        tenantKeyType={TENANT_KEY_TYPE_MAIN} />))
    tabConfigList.push(
      genTabConfig("Target", <WizTenantConfig key="WizTenantConfigSource" showNextTab={genShowNextTab(tabConfigList.length)}
        tenantKeyType={TENANT_KEY_TYPE_TARGET} />))
    tabConfigList.push(
      genTabConfig("Run", <WizRunPage key="WizRunPage" showNextTab={genShowNextTab(tabConfigList.length)} />))

    return tabConfigList
  }, [genShowNextTab])

  return (
    <TabPanelBar tabConfig={tabConfig} tabIdx={tabIdx} setTabIdx={setTabIdx} autoDisable />
  )
}
