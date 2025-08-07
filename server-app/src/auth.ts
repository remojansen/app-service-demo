import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import jwt from "jsonwebtoken";

export async function signJwt() {
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

  // Extract private key more reliably
  let privateKeyOnly: string;
  if (privateKeyPem.includes("-----BEGIN PRIVATE KEY-----")) {
    const startMarker = "-----BEGIN PRIVATE KEY-----";
    const endMarker = "-----END PRIVATE KEY-----";
    const startIndex = privateKeyPem.indexOf(startMarker);
    const endIndex = privateKeyPem.indexOf(endMarker) + endMarker.length;
    privateKeyOnly = privateKeyPem.substring(startIndex, endIndex);
  } else {
    // Fallback to original method if format is different
    privateKeyOnly = privateKeyPem.split("-----END PRIVATE KEY-----")[0] + "-----END PRIVATE KEY-----";
  }
  const publicKeyOnly = privateKeyPem.split("-----END PRIVATE KEY-----")[1];
  console.log(publicKeyOnly);
  const payload = {
    iss: "CN=localhost",
    aud: "demos-event-grid.northeurope-1.ts.eventgrid.azure.net",
    sub: "localhost",
    exp: Math.floor(Date.now() / 1000) + 3600,
    nbf: Math.floor(Date.now() / 1000),
    clientId: "localhost", // Add client ID to match MQTT connection
  };

  const token = jwt.sign(payload, privateKeyOnly, {
    algorithm: "RS256",
    keyid: secretIdentifier
  });

  return token;
}
