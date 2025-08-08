import { IoTDeviceImp } from './device.js';

const devices: IoTDeviceImp[] = [
    new IoTDeviceImp("e1c5c53e-21a9-4765-ae55-db6ab06522f6", "user1@contoso.com", "password1"),
    new IoTDeviceImp("ed4cac72-36d7-4730-89fa-8c5c0654266d", "user2@contoso.com", "password2"),
    new IoTDeviceImp("8edb20d6-7b74-4a6b-b91e-a6d8df402b33", "user3@contoso.com", "password3"),
    new IoTDeviceImp("7e435e48-4aab-4c09-a9a2-cf4b6e63707e", "user4@contoso.com", "password4"),
    new IoTDeviceImp("1c9326e1-3d90-4315-b13a-6199dea4f513", "user5@contoso.com", "password5"),
];

const tenSeconds = 10000;

function generateMockTelemetryData(deviceId: string) {
    const mockTemperature = Math.floor(Math.random() * 100);
    const mockLatitude = (Math.random() * 180 - 90).toFixed(6);
    const mockLongitude = (Math.random() * 360 - 180).toFixed(6);
    const mockBattery = Math.floor(Math.random() * 100);
    const mockTelemetryData = {
        deviceId: deviceId,
        temperature: mockTemperature,
        latitude: mockLatitude,
        longitude: mockLongitude,
        battery: mockBattery,
        datetime: new Date().toISOString(),
    };
    return mockTelemetryData;
}

(async () => {
    const readyDevices = await Promise.all(devices.map(device => {
        return device.initialize().then(() => {
            console.log(`Device ${device.deviceId} initialized successfully.`);
            return device;
        }).catch(error => {
            console.error(`Failed to initialize device ${device.deviceId}:`, error);
            throw error;
        });
    }));
    try {
        for (const device of readyDevices) {
            const topic = `devices/${device.deviceId}/telemetry`;
            setInterval(() => {
                const message = JSON.stringify(generateMockTelemetryData(device.deviceId));
                if (device.publish) {
                    device.publish(topic, message);
                }
            }, tenSeconds);
        }
    } catch (error) {
        console.error("Error sending telemetry:", error);
    }
})();
