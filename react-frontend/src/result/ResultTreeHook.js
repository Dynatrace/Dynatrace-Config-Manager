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

import * as React from 'react'
import TreeItem from '@mui/lab/TreeItem';
import { convertData } from '../result/ResultConvert';
import { useSettingStateValue } from '../context/SettingContext';
import { match_type_label, match_type_palettes } from '../match/matchPalette';

const max_items_per_page = 500

export const useResultTree = (data, sortOrder, searchText, handleContextMenu) => {

    const { resultBlockSize } = useSettingStateValue()

    const resultTreeObjectList = React.useMemo(() => {
        const hasSearchText = (searchText !== undefined && searchText !== "")
        const [tree, oneFound] = convertData(data, sortOrder, hasSearchText, searchText)

        let typeList = []

        for (let subTree of Object.values(tree['children'])) {

            subTree['id'] = 'root'

            let { children, ...rest } = subTree

            const nb_children = subTree.children.length 

            let typeObject = {...rest, 'nb': nb_children, 'children': []}

            const nb_pages = Math.ceil(nb_children / max_items_per_page)

            for (let i = 0; i < nb_pages; i++) {
                const childrenPage = children.slice(i * max_items_per_page, (i + 1) * max_items_per_page)
                let treePage = { ...rest, 'children': childrenPage }

                if (nb_pages >= 2) {
                    treePage['name'] += " Page " + (i+1)
                }

                let worst_match_type = 0
                for (const child of childrenPage) {
                    if(child.match_type > worst_match_type) {
                        worst_match_type = child.match_type
                    }
                }
                treePage.match_type = worst_match_type

                const { elements: renderedTreeItems, expandedList: sub_expanded_list } = renderTreeItems(treePage, oneFound, resultBlockSize, handleContextMenu)
                const expandedList = ["root"].concat(sub_expanded_list)

                if(i == 0) {
                    typeObject['label'] = renderedTreeItems.props.label
                    typeObject['label'] = typeObject['label'].replace(/Page \d/g, "")
                    typeObject['sx'] = renderedTreeItems.props.sx
                }

                typeObject['children'].push({ renderedTreeItems, expandedList })
            }

            typeList.push(typeObject)

        }

        return typeList
    }, [data, sortOrder, searchText, resultBlockSize])

    return resultTreeObjectList

}

const renderTreeItems = (parent, oneFound, resultBlockSize, handleContextMenu, level = 0, isPrevExpandedFound = false, lastExpanded = 0, lastExpandedRoot = 0) => {

    if (parent) {
        level += 1
        const isSubRoot = (level === 2)
        const isChildItem = (level > 2)
        const nodeId = ("" + parent.id)

        let isExpandedFound = false
        let isExpanded = false
        let expandedList = []

        let props = {
            key: parent.id, nodeId, label: genName(parent, level),
            onContextMenu: (event) => { handleContextMenu(event, parent) }
        }

        let colorComponent = false

        if (oneFound) {

            colorComponent = true
            if (parent.success === true) {
                props.sx = { color: 'success.main', boxShadow: 1 }
            } else if (parent.primary === true) {
                props.sx = { color: 'primary.main', boxShadow: 1 }
            } else if (parent.secondary === true) {
                props.sx = { color: 'secondary.main', boxShadow: 1 }
            } else if (parent.highlight === true) {
                props.sx = { color: 'text.primary', boxShadow: 1 }
            } else {
                props.sx = { color: 'text.secondary' }
                colorComponent = false
            }

            if (parent.expand === true) {
                if (isChildItem) {
                    isExpandedFound = true
                }
            }

        } else {

            colorComponent = true

        }

        if (colorComponent) {
            if (parent['match_type']) {
                props.sx = { color: match_type_palettes[parent.match_type], boxShadow: 1 }
            } else if (parent['expected_match'] === 'true') {
                props.sx = { color: 'secondary.dark' }
            } else if (parent['top_match'] === 'true') {
                props.sx = { color: 'secondary.light' }
            } else {
                props.sx = { color: 'text.primary' }
            }
        }

        if (isExpandedFound) {
            isExpanded = true
        } else if (isChildItem && !isPrevExpandedFound) {
            if (lastExpanded === 0 && resultBlockSize > 0) {
                isExpanded = true
            } else if ((lastExpanded - lastExpandedRoot + 2) < resultBlockSize) {
                isExpanded = true
            }
        }

        if (isExpanded) {
            expandedList.push(nodeId)
            lastExpanded = parseInt(nodeId)
            if (lastExpandedRoot === 0) {
                lastExpandedRoot = lastExpanded
            }
        } else {
            lastExpandedRoot = 0
            lastExpanded = 0
        }

        const genChilds = () => {
            if (Array.isArray(parent.children)) {
                return parent.children.map((child) => {

                    const { elements, expandedList: sub_expanded_list } = renderTreeItems(child, oneFound, resultBlockSize, handleContextMenu,
                        level, isExpandedFound, lastExpanded, lastExpandedRoot)
                    expandedList = expandedList.concat(sub_expanded_list)
                    return elements
                })
            } else {
                return null
            }
        }

        return {
            'elements':
                <TreeItem {...props}>
                    <div>
                        {genChilds()}
                    </div>
                </TreeItem >
            , expandedList
        }
    } else {
        return null
    }
}

const genName = (node, level) => {
    let nameInfo = { 'name': node.name, 'hasParenthesis': false }

    if ('displayName' in node) {
        nameInfo = { 'name': node.displayName, 'hasParenthesis': false }
        nameInfo = addInfoToLabel(nameInfo, node, 'name', 'id')
    }

    nameInfo = addInfoToLabel(nameInfo, node, 'top_match', 'Top Match')

    if (level === 1) {
        nameInfo = addInfoToLabel(nameInfo, node, 'match_type', 'Worst Match Type', matchTypeLabeler)
    } else {
        nameInfo = addInfoToLabel(nameInfo, node, 'match_type', 'Match Type', matchTypeLabeler)
    }
    nameInfo = addInfoToLabel(nameInfo, node, 'value', 'Value')
    nameInfo = addInfoToLabel(nameInfo, node, 'total_frames', 'Frames')
    nameInfo = addInfoToLabel(nameInfo, node, 'total_traces', 'Traces')
    nameInfo = addInfoToLabel(nameInfo, node, 'expected_match', 'Expected Match')

    if (nameInfo.hasParenthesis) {
        nameInfo.name += ' ) '
    }

    return nameInfo.name
}

const matchTypeLabeler = (nameInfo, label, value, percent) => {
    nameInfo.name += ' ' + label + ':' + match_type_label[value]
    return nameInfo
}
const tagLabeler = (nameInfo, label, value, percent) => {
    nameInfo.name += ' ' + label + ':' + value + percent
    return nameInfo
}

const addonLabeler = (nameInfo, label, value, percent) => {
    nameInfo.name += label + value + percent
    return nameInfo
}

const addInfoToLabel = (nameInfo, source, key, label, labeler = tagLabeler, acceptZero = false) => {
    if (key in source) {
        ;
    } else {
        return nameInfo
    }

    let value = source[key]
    let percent = ''

    let printValue = false
    if (value) {
        printValue = true
    } else if (acceptZero) {
        if (value === 0 || value === "0") {
            printValue = true
        }
    }

    if (printValue) {
        if (!nameInfo.hasParenthesis) {
            nameInfo.hasParenthesis = true
            nameInfo.name += ' ('
        }

        nameInfo = labeler(nameInfo, label, value, percent)
    }

    return nameInfo
}

