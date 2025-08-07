import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { signJwt } from './auth';

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

  @Get('api/telemetry/:id')
  telemetry(@Param('id') id: string): TelemetryResponse {
    // TODO read from mqtt
    return {
      deviceId: id,
      temperature: Math.floor(Math.random() * 100),
      latitude: (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
      battery: Math.floor(Math.random() * 100),
      datetime: new Date().toISOString()
    };
  }
}
