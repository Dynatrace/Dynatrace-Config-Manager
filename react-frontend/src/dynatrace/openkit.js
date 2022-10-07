import { LogLevel, OpenKitBuilder, Session } from '@dynatrace/openkit-js';

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