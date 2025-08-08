import { Controller, Get, Post, Body, Param, Sse, Query } from '@nestjs/common';
import { signJwt } from './auth';
import { Observable } from 'rxjs';
import { MqttSubscription } from './mqtt';

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

  @Get('api/mqtt/status')
  getMqttStatus() {
    const mqttSubscription = MqttSubscription.getInstance();
    return mqttSubscription.getConnectionStatus();
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
    return new Observable<MessageEvent<TelemetryResponse>>((subscriber) => {
      const topic = `devices/${deviceId}/telemetry`;
      
      // Get the singleton instance
      const mqttSubscription = MqttSubscription.getInstance();
      
      // Subscribe and get cleanup function
      let cleanup: (() => void) | null = null;
      
      mqttSubscription.subscribe(topic, jwt, (data: TelemetryResponse) => {
        console.log(`SUB ${deviceId}:`, data);
        subscriber.next({
          data
        } as MessageEvent<TelemetryResponse>);
      }).then((cleanupFn) => {
        cleanup = cleanupFn;
      }).catch((error) => {
        console.error(`Failed to subscribe to topic ${topic}:`, error);
        subscriber.error(error);
      });

      // Return cleanup function for when SSE client disconnects
      return () => {
        console.log(`SSE client disconnected for device ${deviceId}`);
        if (cleanup) {
          cleanup();
        }
      };
    });
  }

}
