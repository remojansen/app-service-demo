import mqtt from "mqtt";

export interface IoTDevice {
  deviceId: string;
  user: string;
  password: string;
  initialize(): Promise<void>;
  getJWTToken(): Promise<string>;
}

const baseUrl = 'https://iot-api-demo-hjggd9fufccvd0hu.northeurope-01.azurewebsites.net';
const loginEndpoint = `${baseUrl}/api/auth/login`;

export class IoTDeviceImp implements IoTDevice {
  deviceId: string;
  user: string;
  password: string;
  publish: ((topic: string, message: string) => void) | null;

  constructor(deviceId: string, user: string, password: string) {
    this.deviceId = deviceId;
    this.user = user;
    this.password = password;
    this.publish = null;
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

  async initialize(): Promise<void> {

    try {
      // Get JWT token from backend
      const jwtToken = await this.getJWTToken();
      const mqttClient = mqtt.connect(
        "mqtts://demos-event-grid.northeurope-1.ts.eventgrid.azure.net:8883",
        {
          protocolVersion: 5,
          properties: {
            authenticationMethod: 'CUSTOM-JWT',
            authenticationData: Buffer.from(jwtToken),
          },
          clientId: 'localhost',
          clean: false,
          connectTimeout: 30000, // 30 seconds timeout
          reconnectPeriod: 10000,
        }
      );

      // Send telemetry data Event Grid
      return new Promise((resolve, reject) => {

        mqttClient.on('connect', () => {
          // console.log(`Connected to Event Grid for device ${this.deviceId}`);
          // console.log(`Sending telemetry: ${message}`);
          this.publish = (topic: string, message: string) => {
            mqttClient.publish(topic, message, (err) => {
              if (err) {
                // console.error('Failed to publish message:', err);
                // reject(err);
              } else {
                console.log(`PUBLISHED ${topic} ${message}`);
              }
              // mqttClient.end(); // Close connection after publishing
            });
          }
          resolve();
        });

        mqttClient.on('error', (error) => {
          // console.error(`MQTT connection error for device ${this.deviceId}:`, error);
          // mqttClient.end();
          // reject(error);
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