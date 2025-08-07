import mqtt from "mqtt";

export interface IoTDevice {
  deviceId: string;
  user: string;
  password: string;
  sendTelemetry(): Promise<void>;
  getJWTToken(): Promise<string>;
}

const baseUrl = 'http://localhost:3000';
const loginEndpoint = `${baseUrl}/api/auth/login`;

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
    const response = await fetch(loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: this.user, password: this.password }),
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
    
    try {
      // Get JWT token from backend
      const jwtToken = await this.getJWTToken();
      
      // Send telemetry data Event Grid
      return new Promise((resolve, reject) => {
        const mqttClient = mqtt.connect(
          "mqtts://demos-event-grid.northeurope-1.ts.eventgrid.azure.net:8883",
          {
            protocolVersion: 5,
            properties: {
              authenticationMethod: 'CUSTOM-JWT',
              authenticationData: Buffer.from(jwtToken),
            },
            clientId: 'localhost',
            clean: true,
            connectTimeout: 30000, // 30 seconds timeout
            reconnectPeriod: 0, // Disable automatic reconnection
          }
        );

        const topic = `devices/${this.deviceId}/telemetry`;
        const message = JSON.stringify(mockTelemetryData);

        mqttClient.on('connect', () => {
          // console.log(`Connected to Event Grid for device ${this.deviceId}`);
          // console.log(`Sending telemetry: ${message}`);
          
          // Publish message        
          mqttClient.publish(topic, message, (err) => {
            if (err) {
              // console.error('Failed to publish message:', err);
              reject(err);
            } else {
              console.log(`${this.deviceId} ${message}`);
              resolve();
            }
            mqttClient.end(); // Close connection after publishing
          });
        });

        mqttClient.on('error', (error) => {
          // console.error(`MQTT connection error for device ${this.deviceId}:`, error);
          mqttClient.end();
          reject(error);
        });

        mqttClient.on('close', () => {
          // console.log(`MQTT connection closed for device ${this.deviceId}`);
        });
      });
    } catch (error) {
      console.error(`Failed to send telemetry for device ${this.deviceId}:`, error);
      throw error;
    }
  }
}