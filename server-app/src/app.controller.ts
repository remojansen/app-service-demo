import { Controller, Get, Post, Body, Param, Sse, Query } from '@nestjs/common';
import { signJwt } from './auth';
import { Observable } from 'rxjs';
import mqtt from "mqtt";

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface TelemetryResponse {
  deviceId: string;
  temperature: number;
  latitude: string;
  longitude: string;
  battery: number;
  datetime: string;
}

@Controller()
export class AppController {

  @Get()
  getHello(): string {
    return "Hello world!";
  }

  @Post('api/auth/login')
  async login(@Body() data: LoginRequest): Promise<LoginResponse> {
    // Fake user validation
    if (data.username.indexOf("@contoso.com") === -1) {
      throw new Error("Invalid user!");
    }
    const token = await signJwt();
    return {
      token
    };
  }

  @Sse('api/telemetry/:deviceId')
  telemetry(
    @Param('deviceId') deviceId: string,
    @Query('jwt') jwt: string
  ): Observable<MessageEvent<TelemetryResponse>> {
    return new Observable((subscriber) => {
      const topic = `devices/${deviceId}/telemetry`;

      // console.log(`Connecting to MQTT broker with JWT: ${jwt}`);

      const mqttClient = mqtt.connect(
        "mqtts://demos-event-grid.northeurope-1.ts.eventgrid.azure.net:8883",
        {
          protocolVersion: 5,
          properties: {
            authenticationMethod: 'CUSTOM-JWT',
            authenticationData: Buffer.from(jwt),
          },
          clientId: 'localhost',
          clean: true,
          connectTimeout: 30000, // 30 seconds timeout
          reconnectPeriod: 0, // Disable automatic reconnection
        }
      );

      // console.log(`Subscribing to topic: ${topic}`);

      mqttClient.on('connect', () => {
        // console.log("Connected to MQTT broker");
        mqttClient.subscribe(topic, { qos: 1 } , (err) => {
          if (err) {
            console.error("Subscription error:", err);
            subscriber.error(err);
          } else {
            // console.log(`Subscribed to topic: ${topic}`);
          }
        });
      });

      mqttClient.on('message', (topic, payload) => {
        try {
          const message = JSON.parse(payload.toString());
          console.log(`Received message on topic ${topic}:`, message);
          subscriber.next(message);
        } catch (err) {
          console.error("Failed to parse message:", err);
          subscriber.error(err);
        }
      });

      mqttClient.on('error', (error) => {
        console.error("MQTT error:", error);
        subscriber.error(error);
        mqttClient.end();
      });

      mqttClient.on('close', () => {
        console.log("MQTT connection closed");
        subscriber.complete();
      });

      // Cleanup logic when unsubscribed
      return () => {
        mqttClient.end();
      };

    });
  }

}
