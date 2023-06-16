import * as React from 'react';
import HSBar from "react-horizontal-stacked-bar-chart";

export const defaultColumnArray = ['data', '0']
export const STATUS_ORDER = ["I", "A", "U", "D", "Other"]

export const STATUS_PREFIX = {
    "I": "",
    "U": "~",
    "A": "+",
    "D": "-",
    "Other": "?",
}

export const STATUS_LABELS = {
    "I": "Done",
    "U": "~ Change",
    "A": "+ Add",
    "D": "- Destroy",
    "Other": "? Other",
}

export const STATUS_COLORS = {
    "I": "Blue",
    "U": "DarkGoldenRod",
    "A": "ForestGreen",
    "D": "FireBrick",
    "Other": "black",
}

const statusColorsPale = {
    "I": "AliceBlue",
    "U": "LemonChiffon",
    "A": "Honeydew",
    "D": "MistyRose",
    "Other": "WhiteSmoke",
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

    for (const key of Object.values(STATUS_ORDER)) {
        addBarData(key, statuses, hsBarData);
    }

    for (const statusKey of Object.keys(statuses['perStatus'])) {
        if (STATUS_ORDER.includes(statusKey)) {
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

    let colorObject = STATUS_COLORS
    if(statusValueMax === 0) {
        colorObject = statusColorsPale
    }

    let color = colorObject['Other']

    if (statusKey in colorObject) {
        color = colorObject[statusKey]
    }

    let pctBar = 100 / Object.keys(STATUS_LABELS).length
    const minPctBar = 12
    if (pctBar < minPctBar) {
        pctBar = minPctBar
    }


    let name = statusKey
    if (name in STATUS_LABELS) {
        name = STATUS_LABELS[statusKey]
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
