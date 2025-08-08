

document.addEventListener('DOMContentLoaded', () => {

    const baseUrl = 'https://iot-api-demo-hjggd9fufccvd0hu.northeurope-01.azurewebsites.net/';
    const loginEndpoint = `${baseUrl}/api/auth/login`;
    const telemetryEndpoint = `${baseUrl}/api/telemetry`;

    document.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            document.querySelector('#login-response').textContent = 'Loading...';
            const response = await fetch(loginEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: document.querySelector('#username').value,
                    password: document.querySelector('#password').value
                })
            });
            if (response.ok) {
                const data = await response.json();
                document.querySelector('#login-response').textContent = `${data.token}`;
            } else {
                document.querySelector('#login-response').textContent = 'Login failed!';
            }
        } catch (error) {
            document.querySelector('#login-response').textContent = 'Error: ' + error.message;
        }
    });

    document.querySelector('#telemetry-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const jwt = document.querySelector('#login-response').textContent;
            const iotDeviceId = document.querySelector('#iot-device-id').value;
            const eventSource = new EventSource(`${telemetryEndpoint}/${iotDeviceId}?jwt=${jwt}`);
            document.querySelector('#telemetry-response').textContent = 'Loading...';

            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (document.querySelector('#telemetry-response').textContent === 'Loading...') {
                    document.querySelector('#telemetry-response').textContent = '';
                }
                document.querySelector('#telemetry-response').innerHTML += `<p>${JSON.stringify(data, null, 2)}</p></br>`;
            };

            eventSource.onopen = function() {
                console.log('Connection to SSE opened.');
            };

            eventSource.onerror = function(error) {
                console.error('SSE error:', error);
            };

        } catch (error) {
            document.querySelector('#telemetry-response').textContent = 'Error: ' + error.message;
        }
    });
});
