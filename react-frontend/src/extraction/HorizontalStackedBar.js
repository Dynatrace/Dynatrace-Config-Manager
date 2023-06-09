import * as React from 'react';
import HSBar from "react-horizontal-stacked-bar-chart";

export const defaultColumnArray = ['data', '0']
export const statusOrder = ["I", "U", "A", "D", "Other"]

const labels = {
    "A": "Missing (A)",
    "U": "Different (U)",
    "D": "Unexpected (D)",
    "I": "Match (I)",
    "Other": "Other",
}

const statusColors = {
    "Other": "black",
    "A": "DarkGoldenRod",
    "D": "FireBrick",
    "I": "ForestGreen",
    "U": "Blue",
}

const statusColorsPale = {
    "Other": "Snow",
    "A": "LemonChiffon",
    "D": "MistyRose",
    "I": "Honeydew",
    "U": "AliceBlue",
}

export default function HorizontalStackedBar({ id, statuses, onClickMenu }) {
    return (
        <HSBar
            key={id}
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
    return hsBarData;
}

const addBarData = (statusKey, statuses, hsBarData) => {
    let statusValueMax = 0
    if (statusKey in statuses["perStatus"]) {
        statusValueMax = statuses["perStatus"][statusKey]
    }

    let statusValue = 0
    if (statuses['foundAll']) {
        statusValue = statusValueMax
    } else if (statusKey in statuses["found"]) {
        statusValue = statuses["found"][statusKey]
    }

    let colorObject = statusColors
    if(statusValueMax == 0) {
        colorObject = statusColorsPale
    }

    let color = colorObject['Other']

    if (statusKey in colorObject) {
        color = colorObject[statusKey]
    }

    let pctBar = 100 / Object.keys(labels).length
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

    if (statusValueMax >= 1) {
        hsBarData.push({
            name: name,
            value: pctBar,
            description: valueLabel,
            color: color
        })
    } else {
        hsBarData.push({
            name: " ",
            value: pctBar,
            description: " ",
            color: color
        })
    }
}

function sumStatusesTotal(statuses) {
    statuses['total'] = 0;
    for (const statusValue of Object.values(statuses['perStatus'])) {
        statuses['total'] += statusValue;
    }
}
