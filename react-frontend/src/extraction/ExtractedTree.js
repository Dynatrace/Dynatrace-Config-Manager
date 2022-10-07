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
