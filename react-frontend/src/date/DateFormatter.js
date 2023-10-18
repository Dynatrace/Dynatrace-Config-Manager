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