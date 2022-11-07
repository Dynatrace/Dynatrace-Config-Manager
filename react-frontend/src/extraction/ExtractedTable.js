import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const flexSizes = {
    'default': 4,
    'type': 3,
    'service_id': 8,
    'service_name': 20,
    'technology': 4,
    'api_name': 6,
    'clazz': 14,
    'method': 6,
    'web_request_name': 20,
    'count': 3,
    'web_request_id': 8,
    'context_root': 12,
    'host': 10,
    'relative_url': 16,
    'scope': 30,
    'from': 30,
    'to': 30,
    'schemaId': 30,
}
const minWidthMap = {
    'default': 50,
    'scope': 300,
    'from': 300,
    'to': 300,
    'schemaId': 300,
}

const autoHiddenColumns = {
    'web_request_id': true,
    'service_id': true,
}

const keyColumns = [
    'scope',
    'from',
    'to',
    'schemaId'
]

export default function ExtractedTable({ data }) {


    const [columns, rows] = React.useMemo(() => {
        if (!data || !data['items']) {
            return [null, null]
        }


        const onContextMenu = (e, cell) => {
            console.log(cell['value']);
        };

        let columns = []
        columns.push({
            field: "ctxMenuBtn", headerName: "", minWidth: minWidthMap['default'], flex: flexSizes['default'], sortable: true, type: "string", hide: false,
            renderCell: (cellValues) => {
                let value = ""
                if (cellValues) {
                    value = cellValues
                }
                return (
                    <IconButton
                        variant="outlined"
                        color="primary"
                        onClick={(event) => {
                            onContextMenu(event, value)
                        }}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                )
            }
        })
        let column_exist_hash = {}
        let rows = []
        let id = 0

        for (const row_data of Object.values(data['items'])) {
            

            let keyObject = {}
            for (const column_key of keyColumns) {
                if (column_key in row_data) {
                    [columns, column_exist_hash] = add_column(columns, column_exist_hash, column_key)
                    keyObject[column_key] = row_data[column_key]
                }
            }

            for (const column_key of Object.keys(row_data)) {

                [columns, column_exist_hash] = add_column(columns, column_exist_hash, column_key)
            }

            const row = row_data
            if (row['id']) {
                row['the_id'] = row['id']
                row['id'] = id
            }
            row['ctxMenuBtn'] = keyObject

            rows.push({ id, ...row })
            id += 1
        }

        return [columns, rows]

    }, [data])

    const grid = React.useMemo(() => {

        if (rows && rows.length > 0) {
            return (
                <DataGrid
                    rows={rows}
                    columns={columns}
                    autoHeight
                    resizable
                />
            )
        }
        return null

    }, [columns, rows])

    return grid
}

const add_column = (columns, column_exist_hash, column_key) => {
    if (!column_exist_hash[column_key]) {
        let flexSize = flexSizes['default']
        if (column_key in flexSizes) {
            flexSize = flexSizes[column_key]
        }

        let minWidth = minWidthMap['default']
        if (column_key in minWidthMap) {
            minWidth = minWidthMap[column_key]
        }

        let header = column_key
        if (header === 'clazz') {
            header = 'class'
        }
        let hide = false
        if (autoHiddenColumns[column_key] === true) {
            hide = true
        }
        column_exist_hash[column_key] = true
        columns.push({ field: column_key, headerName: header, minWidth: minWidth, flex: flexSize, sortable: true, type: "string", hide })
    }

    return [columns, column_exist_hash]
}