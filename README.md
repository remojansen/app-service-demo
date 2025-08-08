# DEMO

:warning: **Warning: This project is for demonstration purposes only and is not production-ready. Microsoft is not responsible for any issues arising from its usage.**

This demo showcases how to implement JWT Auth in Azure Event Grid (MQTT).

The backend can be deployed to Azure App Service as a Docker Container by pushing it to an Azure Container Registry.

The demo contains 3 main components:

- [`server-app`](./server-app/README.md) A Node.js Nest REST API with an endpoint for login (JWT) and an endpoint getting IoT device telemetry (SSE).

- [`mobile-app`](./mobile-app/README.md) A front end HTML + JS app that allows to test the REST API endpoints.

- [`iot-device`](./iot-device/README.md) A IoT device simulation that pushes telemetry data to Azure Event Grid (MQTT).

