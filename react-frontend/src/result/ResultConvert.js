import { ALPHABETIC, FIRST_SEEN_TMS, LAST_SEEN_TMS, MATCH_TYPE } from '../options/SortOrderOption';

export const convertData = (data, sortOrder, hasSearchText, searchText) => {

    let tree = null

    const entries = Object.entries(data)

    if (entries.length < 1) {
        const oneFound = false
        return [tree, oneFound]
    }

    let topName = 'Analysis Result'
    if (data && 'data' in data && 'name' in data['data']) {
        topName = data['data']['name']
    }

    tree = {
        id: 'root',
        name: topName
    }

    const isFoundFunction = genIsFoundFunction(hasSearchText, searchText)

    const sortFunction = genSortFunction(sortOrder, hasSearchText)

    const [subChildren, oneFound,] = convertItem(data['data'], sortOrder, isFoundFunction, sortFunction)
    tree['children'] = subChildren

    if (tree['children'].length > 0) {
        return [tree, oneFound]
    }

    return [tree, oneFound]

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


const genIsFoundFunction = (hasSearchText, searchText) => {

    let defaultValue = false

    let hasEntrypointInfo = (node) => [false, false, false]

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


const convertItem = (object, sortOrder, isFoundFunction, sortFunction, isFirstCall = true, id_num = 0) => {

    let sortedChildren = []
    let oneChildFound = false

    if (object && 'children' in object) {
        let children = []

        let entries = Object.entries(object['children'])

        if (entries.length > 0) {

            for (const [key, value] of entries) {

                id_num += 1
                const id = "" + id_num

                const [sub_children, sub_found, sub_id] = convertItem(value, sortOrder, isFoundFunction, sortFunction, false, id_num)
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
