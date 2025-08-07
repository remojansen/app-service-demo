

document.addEventListener('DOMContentLoaded', () => {

    const baseUrl = 'http://localhost:3000';
    const loginEndpoint = `${baseUrl}/api/auth/login`;
    const telemetryEndpoint = `${baseUrl}/api/telemetry`;

    document.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            document.querySelector('#login-response').textContent = 'Looading...';
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
            const iotDeviceId = document.querySelector('#iot-device-id').value;
            document.querySelector('#telemetry-response').textContent = 'Looading...';
            const response = await fetch(`${telemetryEndpoint}/${iotDeviceId}`);
            if (response.ok) {
                const data = await response.json();
                document.querySelector('#telemetry-response').textContent = `${JSON.stringify(data, null, 2)}`;
            } else {
                document.querySelector('#telemetry-response').textContent = 'Login failed!';
            }
        } catch (error) {
            document.querySelector('#telemetry-response').textContent = 'Error: ' + error.message;
        }
    });
});
