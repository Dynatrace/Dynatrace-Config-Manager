import * as React from 'react';
import DocumAPIToken from './DocumAPIToken';
import TabPanelBar, { genTabConfig } from '../navigation/TabPanelBar';


const tabConfig = [
    genTabConfig("API Tokens", <DocumAPIToken />),
]

export default function DocumPanel() {
    return (
        <TabPanelBar tabConfig={tabConfig} />
    )
}

