1. Build the image:

```sh
docker build --platform=linux/amd64  -t node-demo:latest .
```

2. Push the image:

```sh
docker login appservicedemo.azurecr.io
docker tag node-demo:latest appservicedemo.azurecr.io/
docker push appservicedemo.azurecr.io/node-demo:latest
```
