import { IoTDeviceImp } from './device.js';

const devices: IoTDeviceImp[] = [
    new IoTDeviceImp("e1c5c53e-21a9-4765-ae55-db6ab06522f6", "user1@contoso.com", "password1"),
    new IoTDeviceImp("ed4cac72-36d7-4730-89fa-8c5c0654266d", "user2@contoso.com", "password2"),
    new IoTDeviceImp("8edb20d6-7b74-4a6b-b91e-a6d8df402b33", "user3@contoso.com", "password3"),
    new IoTDeviceImp("7e435e48-4aab-4c09-a9a2-cf4b6e63707e", "user4@contoso.com", "password4"),
    new IoTDeviceImp("1c9326e1-3d90-4315-b13a-6199dea4f513", "user5@contoso.com", "password5"),
];

const tenSeconds = 10000;

setInterval(async () => {
    (async () => {
        try {
            for (const device of devices) {
                await device.sendTelemetry();
            }
        } catch (error) {
            console.error("Error sending telemetry:", error);
        }
    })();
}, tenSeconds);
