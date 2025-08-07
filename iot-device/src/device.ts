import mqtt from "mqtt";

export interface IoTDevice {
  deviceId: string;
  user: string;
  password: string;
  sendTelemetry(): Promise<void>;
  getJWTToken(): Promise<string>;
}

export class IoTDeviceImp implements IoTDevice {
  deviceId: string;
  user: string;
  password: string;

  constructor(deviceId: string, user: string, password: string) {
    this.deviceId = deviceId;
    this.user = user;
    this.password = password;
  }

  async getJWTToken(): Promise<string> {
    const response = await fetch("http://localhost:3000/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: this.user, password: this.password }),
    });
    if (!response.ok) {
      throw new Error(`Failed to get JWT token: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.token) {
      throw new Error("JWT token not found in response");
    }
    return data.token;
  }

  async sendTelemetry(): Promise<void> {
    // Simulate telemetry data
    const mockTemperature = Math.floor(Math.random() * 100);
    const mockLatitude = (Math.random() * 180 - 90).toFixed(6);
    const mockLongitude = (Math.random() * 360 - 180).toFixed(6);
    const mockBattery = Math.floor(Math.random() * 100);
    const mockTelemetryData = {
      deviceId: this.deviceId,
      temperature: mockTemperature,
      latitude: mockLatitude,
      longitude: mockLongitude,
      battery: mockBattery,
      datetime: new Date().toISOString(),
    };
    // Get JWT token from backend
    const jwtToken = await this.getJWTToken();
    // Send telemetry data Event Grid
    const mqttClient = mqtt.connect(
      "demos-event-grid.northeurope-1.ts.eventgrid.azure.net",
      {
        protocolVersion: 5,
        properties: {
          authenticationMethod: 'CUSTOM-JWT',
          authenticationData: Buffer.from(jwtToken),
        },
        clientId: 'your-client-id',
        clean: true,
      }
    );
    const topic = "demo-topic";
    const message = JSON.stringify(mockTelemetryData);

    mqttClient.on('connect', () => {
      if (mqttClient.connected === true) {
        console.log(`${this.deviceId} ${mockTelemetryData}`);
        // publish message        
        mqttClient.publish(topic, message);
      }
    });

    mqttClient.on('error', (error) => {
      console.error(error);
      process.exit(1);
    });
  }
}