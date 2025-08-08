## Develop

```
az login
```

```
npm run start:dev
```

## Deploy

1. Build the image:

```sh
docker build --platform=linux/amd64 -t iot-api-demo:latest .
```

2. Push the image to the AZ Container Registry:

```sh
docker login demoscontreg.azurecr.io
docker tag iot-api-demo:latest demoscontreg.azurecr.io/iot-api-demo:latest
docker push demoscontreg.azurecr.io/iot-api-demo:latest
```
