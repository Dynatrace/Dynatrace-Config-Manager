import * as React from 'react'
import TreeItem from '@mui/lab/TreeItem';
import { convertData } from '../result/ResultConvert';
import { useSettingStateValue } from '../context/SettingContext';
import { match_type_label, match_type_palettes } from '../match/matchPalette';

export const useResultTree = (data, sortOrder, searchText, handleContextMenu, containsEntrypoint = false) => {


    const { resultBlockSize } = useSettingStateValue()

    return React.useMemo(() => {
        const hasSearchText = (searchText !== undefined && searchText !== "")
        const [tree, metadata, oneFound] = convertData(data, sortOrder, hasSearchText, searchText, containsEntrypoint)
        let sampleSum = null
        if (metadata && 'samples_sum' in metadata) {
            sampleSum = metadata['samples_sum']
        }
        const { elements: renderedTreeItems, expandedList: sub_expanded_list } = renderTreeItems(tree, oneFound, sampleSum, resultBlockSize, handleContextMenu)
        const expandedList = ["root"].concat(sub_expanded_list)
        return { renderedTreeItems, expandedList }
    }, [data, sortOrder, searchText])

}

const renderTreeItems = (parent, oneFound, sampleSum, resultBlockSize, handleContextMenu, level = 0, isPrevExpandedFound = false, lastExpanded = 0, lastExpandedRoot = 0) => {

    if (parent) {
        level += 1
        const isSubRoot = (level === 2)
        const isChildItem = (level > 2)
        const nodeId = ("" + parent.id)

        let isExpandedFound = false
        let isExpanded = false
        let expandedList = []

        let props = {
            key: parent.id, nodeId, label: genName(parent, sampleSum),
            onContextMenu: (event) => { handleContextMenu(event, parent) }
        }

        let colorComponent = false

        if (oneFound) {

            colorComponent = true
            if (parent.success == true) {
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
            if (lastExpanded == 0 && resultBlockSize > 0) {
                isExpanded = true
            } else if ((lastExpanded - lastExpandedRoot + 2) < resultBlockSize) {
                isExpanded = true
            }
        }

        if (isExpanded) {
            expandedList.push(nodeId)
            lastExpanded = parseInt(nodeId)
            if (lastExpandedRoot == 0) {
                lastExpandedRoot = lastExpanded
            }
        } else {
            lastExpandedRoot = 0
            lastExpanded = 0
        }

        const genChilds = () => {
            if (Array.isArray(parent.children)) {
                return parent.children.map((child) => {
                    let subSamplesSum = sampleSum
                    if (isSubRoot && sampleSum) {
                        subSamplesSum = sampleSum[parent.name]
                    }

                    const { elements, expandedList: sub_expanded_list } = renderTreeItems(child, oneFound, subSamplesSum, resultBlockSize, handleContextMenu,
                        level, isExpandedFound, lastExpanded, lastExpandedRoot)
                    expandedList = expandedList.concat(sub_expanded_list)
                    return elements
                })
            } else {
                return null
            }
        }

        if (parent['displayName'] == "gke-ext-demo1-jmeter-1eb7c441-363w.c.dynatrace-demoability.internal"
            || parent['displayName'] == "gke-ext-demo1-ubuntu-c94da477-jvbx.c.dynatrace-demoability.internal") {
            console.log(parent['id'], props)
        }

        return {
            'elements':
                <TreeItem {...props}>
                    {genChilds()}
                </TreeItem >
            , expandedList
        }
    } else {
        return null
    }
}

const sample_types = {
    "RUNNING": 0,
    "LOCK": 0,
    "DISK_IO": 0,
    "WAIT": 0,
    "NET_IO": 0
}

const genName = (node, sampleSum = null) => {
    let nameInfo = { 'name': node.name, 'hasParenthesis': false }

    if ('displayName' in node) {
        nameInfo = { 'name': node.displayName, 'hasParenthesis': false }
        nameInfo = addInfoToLabel(nameInfo, node, 'name', 'id')
    }
    nameInfo = addInfoToLabel(nameInfo, node, 'top_match', 'Top Match')
    nameInfo = addInfoToLabel(nameInfo, node, 'match_type', 'Match Type', matchTypeLabeler)
    nameInfo = addInfoToLabel(nameInfo, node, 'value', 'Value')
    nameInfo = addInfoToLabel(nameInfo, node, 'total_frames', 'Frames')
    nameInfo = addInfoToLabel(nameInfo, node, 'total_traces', 'Traces')
    nameInfo = addInfoToLabel(nameInfo, node, 'expected_match', 'Expected Match')
    nameInfo = addSamplesToLabel(nameInfo, node, sampleSum)

    if (nameInfo.hasParenthesis) {
        nameInfo.name += ' ) '
    }

    return nameInfo.name
}

const addSamplesToLabel = (nameInfo, node, sampleSum = null) => {

    const samples = node.samples
    if (samples) {
        nameInfo = addSampleGroupToLabel(nameInfo, samples, sampleSum)
    }

    const original_samples = node.original_samples
    if (original_samples) {

        if (nameInfo.hasParenthesis) {
            nameInfo.name += ' ) '
            nameInfo.hasParenthesis = false
        } else {
            nameInfo.name += ' ( ) '
        }

        nameInfo.name += ' of '
        nameInfo = addSampleGroupToLabel(nameInfo, original_samples, sampleSum)
    }

    return nameInfo

}

const addSampleGroupToLabel = (nameInfo, samples, sampleSum = null) => {

    if (samples) {
        for (const key of Object.keys(sample_types)) {
            nameInfo = addInfoToLabel(nameInfo, samples, key, key, tagLabeler, sampleSum)
        }
    }

    return nameInfo

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

const addInfoToLabel = (nameInfo, source, key, label, labeler = tagLabeler, sampleSum = null, acceptZero = false) => {
    if(key in source) {
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

        if (sampleSum && sampleSum[key]) {
            value = parseFloat(value / sampleSum[key] * 100).toFixed(2)
            percent = '%'
        }
        nameInfo = labeler(nameInfo, label, value, percent)
    }

    return nameInfo
}

