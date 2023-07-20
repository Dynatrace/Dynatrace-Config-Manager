import * as React from 'react';
import CredentialPanel from '../credentials/CredentialPanel';
import DocumPanel from '../docum/DocumPanel';
import ExtractionPanel from '../extraction/ExtractionPanel';
import MatchPanel from '../match/MatchPanel';
import Setting from '../setting/Setting';
import MigratePanel from '../migrate/MigratePanel';
import TabPanelBar, { genTabConfig } from './TabPanelBar';
import HistoryPanel from '../history/HistoryPanel';


const tabConfig = [
  genTabConfig("Credentials", <CredentialPanel />),
  genTabConfig("Extract", <ExtractionPanel />),
  //genTabConfig("Match", <MatchPanel />),
  genTabConfig("Manage Configs", <MigratePanel />),
  genTabConfig("History", <HistoryPanel />),
  //genTabConfig("Settings", <Setting />),
  genTabConfig("Documentation", <DocumPanel />),
]

export default function TabPanelMain() {
  return (
    <TabPanelBar tabConfig={tabConfig} />
  )
}
