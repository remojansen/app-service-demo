import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import jwt from "jsonwebtoken";

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

async function signJwt() {
  const secretIdentifier = "https://demos-keyvault.vault.azure.net/secrets/demo-cert/93f0265fcb61422fb22fc377817ac23e";

  const credential = new DefaultAzureCredential();

  // Extract vault URL and secret name from the identifier
  const urlParts = secretIdentifier.split("/");
  const vaultUrl = `${urlParts[0]}//${urlParts[2]}`;
  const secretName = urlParts[4];
  const secretVersion = urlParts[5];
  const secretClient = new SecretClient(vaultUrl, credential);
  const secret = await secretClient.getSecret(secretName, { version: secretVersion });
  const privateKeyPem = secret.value!;

  const payload = {
    iss: "localhost",
    aud: "demos-event-grid.northeurope-1.ts.eventgrid.azure.net",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const token = jwt.sign(payload, privateKeyPem, {
    algorithm: "RS256",
    keyid: secretName
  });

  return token;
}



@Controller()
export class AppController {

  @Get()
  getHello(): string {
    return "Hello world!";
  }

  @Post('api/auth/login')
  async login(@Body() data: LoginRequest): Promise<LoginResponse> {
    console.log(data.username.indexOf("@contoso.com"), data.username);
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
