export function getTimestampActionId() {
    const d = new Date()

    var yyyy = d.getFullYear().toString()
    var MM = pad(d.getMonth() + 1, 2)
    var dd = pad(d.getDate(), 2)
    var hh = pad(d.getHours(), 2)
    var mm = pad(d.getMinutes(), 2)
    var ss = pad(d.getSeconds(), 2)

    return `${yyyy}-${MM}-${dd}_${hh}-${mm}-${ss}`
}

function pad(number, length) {
    var str = '' + number
    while (str.length < length) {
        str = '0' + str
    }
    return str
}