import { ALPHABETIC, FIRST_SEEN_TMS, LAST_SEEN_TMS, MATCH_TYPE } from '../options/SortOrderOption';

export const convertData = (data, sortOrder, hasSearchText, searchText, containsEntrypoint) => {

    let tree = null
    let metadata = null

    const entries = Object.entries(data)

    if (entries.length < 1) {
        const oneFound = false
        return [tree, metadata, oneFound]
    }

    tree = {
        id: 'root',
        name: 'Analysis Result'
    }

    const isFoundFunction = genIsFoundFunction(hasSearchText, searchText, containsEntrypoint)

    const sortFunction = genSortFunction(sortOrder, hasSearchText)

    if ('metadata' in data) {
        metadata = data['metadata']
    }

    const [subChildren, oneFound,] = convertItem(data['data'], metadata, sortOrder, isFoundFunction, sortFunction)
    tree['children'] = subChildren
    tree = addUpSubSamples(tree)

    if (tree['children'].length > 0) {
        return [tree, metadata, oneFound]
    }

    return [tree, metadata, oneFound]

}

const genSortFunction = (sortOrder, hasSearchText) => {

    const sortComparators = {}
    sortComparators[ALPHABETIC] = compareStringNames
    sortComparators[LAST_SEEN_TMS] = genCompareNumericValuesL1('firstSeenTms')
    sortComparators[FIRST_SEEN_TMS] = genCompareNumericValuesL1('lastSeenTms')
    sortComparators[MATCH_TYPE] = genCompareNumericValuesL1('match_type')

    const preSortCompareFunction = sortComparators[sortOrder]
    const preSortFunction = (list) => { list.sort(preSortCompareFunction) }

    let sortFoundFunction
    if (hasSearchText) {
        sortFoundFunction = (list) => { list.sort(compareFound) }
    } else {
        sortFoundFunction = (list) => { }
    }

    return (children) => {
        let sortedChildren = children.slice(0)
        preSortFunction(sortedChildren)
        sortFoundFunction(sortedChildren)
        return sortedChildren
    }

}


const genIsFoundFunction = (hasSearchText, searchText, containsEntrypoint) => {

    let defaultValue = false

    let hasEntrypointInfo = (node) => [false, false, false]
    if (containsEntrypoint) {
        defaultValue = false

        hasEntrypointInfo = (node) => {
            let isPrimary = false
            let isSecondary = false
            let isLocal = false

            if (node.hasOwnProperty('entrypoint')) {
                for (const tenantUI of node['entrypoint']) {
                    for (const entrypoint of tenantUI) {
                        if (entrypoint['type'] === "Pre Entry") {
                            isSecondary = true
                        } else if (entrypoint['type'] === "Entry") {
                            isPrimary = true
                        }
                    }
                }
            }
            if (node.hasOwnProperty('local_entrypoint')) {
                isLocal = true
            }
            return [isPrimary, isSecondary, isLocal]

        }
    }

    let containsSearchText = (node) => false

    if (hasSearchText) {
        defaultValue = false

        containsSearchText = (node) => {
            if (node['displayName']) {
                if (node['displayName'].includes(searchText)) {
                    return true
                }
            } else if (node['name']) {
                if (node['name'].includes(searchText)) {
                    return true
                }
            }
            return false
        }
    }

    const isFoundFunction = (node) => [defaultValue, hasEntrypointInfo(node), containsSearchText(node)]
    return isFoundFunction
}


const convertItem = (object, metadata, sortOrder, isFoundFunction, sortFunction, isFirstCall = true, id_num = 0) => {

    let sortedChildren = []
    let oneChildFound = false

    if (object && 'children' in object) {
        let children = []

        let entries = Object.entries(object['children'])

        if (entries.length > 0) {

            for (const [key, value] of entries) {

                id_num += 1
                const id = "" + id_num

                const [sub_children, sub_found, sub_id] = convertItem(value, metadata, sortOrder, isFoundFunction, sortFunction, false, id_num)
                id_num = sub_id

                let child = { id, 'name': key }

                if (sub_children.length > 0) {
                    child['children'] = sub_children
                }

                for (const [property, property_value] of Object.entries(value)) {

                    if (property !== 'children') {
                        child[property] = property_value
                    }
                }

                const [defaultValue, [foundEntryPoint, foudPreEntrypoint, isLocal], foundText] = isFoundFunction(child)


                const childFound = (defaultValue || foundEntryPoint || foudPreEntrypoint || foundText)
                if (childFound || sub_found) {
                    oneChildFound = true
                }

                child['success'] = isLocal
                child['primary'] = foundEntryPoint
                child['secondary'] = foudPreEntrypoint
                child['highlight'] = foundText

                child = applyNodeFound(child, childFound, sub_found, isFirstCall)

                children.push(child)

            }

        }

        sortedChildren = sortFunction(children)
    }

    return [sortedChildren, oneChildFound, id_num]
}

const applyNodeFound = (node, nodeFound, oneChildFound, isFirstCall) => {

    if (nodeFound || oneChildFound) {

        if (isFirstCall) {
            node['highlight'] = true
        }

        node['expand'] = false

        if (nodeFound) {
            ;
        } else {

            if ('samples' in node) {
                node = addUpSubSamples(node, nodeFound)
            }

        }

    } else {
        node = addUpSubSamples(node, false)
    }

    return node
}

const addUpSubSamples = (node, isFound) => {
    let samples = {}
    let hasSamples = false

    const _addUpOneSampleNode = (source, doAdd) => {

        if ('samples' in source) {
            for (const key of Object.keys(source['samples'])) {
                if (samples[key] === undefined) {
                    samples[key] = 0
                    hasSamples = true
                }
                if (doAdd) {
                    samples[key] += source['samples'][key]
                }

            }
        }
    }

    if ('children' in node) {
        for (const child of Object.values(node['children'])) {
            _addUpOneSampleNode(child, true)
        }
    } else {
        _addUpOneSampleNode(node, isFound)
    }

    if (hasSamples) {
        node = setNewSamples(node, samples)
    }

    return node
}

const setNewSamples = (node, samples) => {

    let hasChangedValues = false

    if ('samples' in node) {
        for (const [key, value] of Object.entries(node['samples'])) {
            if (samples[key] !== value) {
                hasChangedValues = true
            }
        }
    }

    if (hasChangedValues) {
        node['original_samples'] = node['samples']
        node['samples'] = samples
    }

    return node
}

const genCompareNumericValuesL1 = (key) => {

    const compareNumericValues = (a, b) => {
        if (b[key]) {
            if (a[key]) {
                return b[key] - a[key]
            } else {
                return b[key] - 0
            }
        } else if (a[key]) {
            return 0 - a[key]
        }
        return 0
    }

    return compareNumericValues
}

const genCompareNumericValuesL2 = (key, sub_key) => {

    const compareNumericValues = (a, b) => {

        if (b[key] && b[key][sub_key]) {
            if (a[key] && a[key][sub_key]) {
                return b[key][sub_key] - a[key][sub_key]
            } else {
                return b[key][sub_key] - 0
            }
        } else if (a[key] && a[key][sub_key]) {
            return 0 - a[key][sub_key]
        }
        return 0
    }

    return compareNumericValues
}

const compareStringNames = (a, b) => {
    if (a.displayName && b.displayName) {
        return a.displayName.localeCompare(b.displayName)
    } else if (a.name && b.name) {
        return a.name.localeCompare(b.name)
    } else {
        return 0
    }

}

const compareFound = (a, b) => {
    return b.found - a.found;
}
