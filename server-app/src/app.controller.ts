import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';

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
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('api/auth/login')
  login(@Body() data: LoginRequest): LoginResponse {
    // TODO create JWT
    return {
      token: 'test-token'
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
