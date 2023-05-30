import * as React from 'react';
import HSBar from "react-horizontal-stacked-bar-chart";

export const defaultColumnArray = ['data', '0']
export const statusOrder = ["I", "U", "A", "D"]

const labels = {
    "A": "Missing (A)",
    "U": "Different (U)",
    "D": "Unexpected (D)",
    "I": "Match (I)",
}

const statusColors = {
    "default": "black",
    "A": "DarkGoldenRod",
    "D": "FireBrick",
    "I": "ForestGreen",
    "U": "Blue",
}

export default function HorizontalStackedBar({ id, statuses, onClickMenu }) {
    return (
        <HSBar
            height={35}
            showTextIn
            id={id}
            fontColor="white"
            data={buildHSBarData(statuses)}
            onClick={onClickMenu} />
    )
}

function buildHSBarData(statuses) {
    let hsBarData = [];

    sumStatusesTotal(statuses);

    for (const key of Object.values(statusOrder)) {
        addBarData(key, statuses, hsBarData);
    }

    for (const statusKey of Object.keys(statuses['perStatus'])) {
        if (statusOrder.includes(statusKey)) {
            continue;
        }
        addBarData(statusKey, statuses, hsBarData);
    }
    console.log(hsBarData)
    return hsBarData;
}

const addBarData = (statusKey, statuses, hsBarData) => {
    if (statusKey in statuses["perStatus"]) {
        // pass
    } else {
        return
    }

    const statusValueMax = statuses["perStatus"][statusKey]
    let statusValue = 0
    if (statuses['foundAll']) {
        statusValue = statusValueMax
    } else if (statusKey in statuses["found"]) {
        statusValue = statuses["found"][statusKey]
    }

    let color = statusColors['default']

    if (statusKey in statusColors) {
        color = statusColors[statusKey]
    }

    let pctBar = statusValue / statuses['total'] * 100
    const minPctBar = 12
    if (pctBar < minPctBar) {
        pctBar = minPctBar
    }


    let name = statusKey
    if (name in labels) {
        name = labels[statusKey]
    }

    let valueLabel = "" + statusValue
    if (statuses['foundAll']) {
        // pass
    } else {
        valueLabel += "/" + statusValueMax
    }

    hsBarData.push({
        name: name,
        value: pctBar,
        description: valueLabel,
        color: color
    })
}

function sumStatusesTotal(statuses) {
    statuses['total'] = 0;
    for (const statusValue of Object.values(statuses['perStatus'])) {
        statuses['total'] += statusValue;
    }
}
