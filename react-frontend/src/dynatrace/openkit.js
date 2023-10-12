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

import { OpenKitBuilder } from '@dynatrace/openkit-js';

const applicationName = 'Dynatrace-Config-Manager';
const applicationID = 'cbe704cc-9afb-4e0b-aa64-5cab731b30ef';
//const deviceID = 42;
const endpointURL = 'https://bf04869fgs.bf.dynatrace.com/mbeacon';

const openKit = new OpenKitBuilder(endpointURL, applicationID/*, deviceID*/)
    .withApplicationName(applicationName)
    .withApplicationVersion('1.0.0.0')
    .withOperatingSystem(window.navigator.userAgent)
    //.withManufacturer('MyCompany')
    //.withModelId('MyModelId')
    .build();

const timeoutInMilliseconds = 10 * 1000;

openKit.waitForInit((success) => {
    if (success) {
        const clientIP = '8.8.8.8';
        const session = openKit.createSession(clientIP);

        session.identifyUser('jane.doe@example.com');

        const actionName = 'rootActionName';
        const action = session.enterAction(actionName);

        action.leaveAction();
        session.end();
        openKit.shutdown();
    }
}, timeoutInMilliseconds);