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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';

export default function ExtractedTree({ data }) {


    const testLog = (item, event) => {

        alert(item.name);
        //setActiveItemId(item.id);
        // if you want after click do expand/collapse comment this two line
        event.stopPropagation();
        event.preventDefault();
    }

    const renderTree = (nodes) => {

        if (nodes) {
            return (
                <TreeItem key={nodes.id} nodeId={"" + nodes.id} label={nodes.name} onDoubleClick={event => { testLog(nodes, event) }}>
                    {Array.isArray(nodes.children)
                        ? nodes.children.map((node) => renderTree(node))
                        : null}
                </TreeItem>
            )
        } else {
            return null
        }
    }
        ;

    return (
        <TreeView
            aria-label="rich object"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpanded={['root']}
            defaultExpandIcon={<ChevronRightIcon />}
            sx={{ flexGrow: 1, overflowY: 'auto' }}
        >
            {renderTree(convert(data))}
        </TreeView>
    );
}

const convert = (data) => {

    const genName = (key, value) => {
        return value + ' ( ' + key + ' )'
    }

    let tree = {
        id: 'root',
        name: 'Process Groups Extracted'
    }
    let children = []
    let id = 0

    for (const [key, value] of Object.entries(data)) {

        id += 1
        let pg = { id, 'name': genName(key, value['name']) }
        let sub_children = []

        if ('pgis' in value) {
            for (const [pgi_key, pgi_value] of Object.entries(value['pgis'])) {
                id += 1
                sub_children.push({ id, 'name': genName(pgi_key, pgi_value) })
            }
        }

        pg['children'] = sub_children
        children.push(pg)
    }
    
    tree['children'] = children

    if (id > 0) {
        return tree
    } else {
        return null
    }
}
