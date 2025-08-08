import mqtt from 'mqtt';
import { EventEmitter } from 'events';

interface TelemetryResponse {
    deviceId: string;
    temperature: number;
    latitude: string;
    longitude: string;
    battery: number;
    datetime: string;
}

interface Subscription {
    topic: string;
    callback: (data: TelemetryResponse) => void;
    id: string;
}

export class MqttSubscription extends EventEmitter {
    private static instance: MqttSubscription;
    private mqttClient: mqtt.MqttClient | null = null;
    private subscriptions: Map<string, Subscription[]> = new Map();
    private isConnecting: boolean = false;
    private isConnected: boolean = false;
    private currentJwt: string | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): MqttSubscription {
        if (!MqttSubscription.instance) {
            MqttSubscription.instance = new MqttSubscription();
        }
        return MqttSubscription.instance;
    }

    private async ensureConnection(jwt: string): Promise<void> {
        // If we already have a connection with the same JWT, reuse it
        if (this.isConnected && this.currentJwt === jwt) {
            return;
        }

        // If we're already connecting, wait for it to complete
        if (this.isConnecting) {
            return new Promise((resolve, reject) => {
                this.once('connected', resolve);
                this.once('error', reject);
            });
        }

        // If we have an existing connection with different JWT, close it
        if (this.mqttClient) {
            console.log('Closing existing MQTT connection due to JWT change');
            this.mqttClient.end();
            this.mqttClient = null;
            this.isConnected = false;
        }

        this.isConnecting = true;
        this.currentJwt = jwt;

        return new Promise((resolve, reject) => {
            this.mqttClient = mqtt.connect(
                'mqtts://demos-event-grid.northeurope-1.ts.eventgrid.azure.net:8883',
                {
                    protocolVersion: 5,
                    properties: {
                        authenticationMethod: 'CUSTOM-JWT',
                        authenticationData: Buffer.from(jwt),
                    },
                    clientId: `persistent-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    clean: false,
                    connectTimeout: 30000,
                    reconnectPeriod: 10000,
                }
            );

            this.mqttClient.on('connect', () => {
                console.log('Persistent MQTT connection established');
                this.isConnecting = false;
                this.isConnected = true;
                this.emit('connected');
                resolve();
            });

            this.mqttClient.on('message', (receivedTopic, payload) => {
                console.log(`Message received on topic ${receivedTopic}:`, payload.toString());
                this.handleMessage(receivedTopic, payload);
            });

            this.mqttClient.on('error', (error) => {
                console.error('Persistent MQTT connection error:', error);
                this.isConnecting = false;
                this.isConnected = false;
                this.emit('error', error);
                reject(error);
            });

            this.mqttClient.on('close', () => {
                console.log('Persistent MQTT connection closed');
                this.isConnected = false;
                this.isConnecting = false;
                // Notify all subscriptions that connection is lost
                this.emit('disconnected');
            });

            this.mqttClient.on('offline', () => {
                console.log('Persistent MQTT connection went offline');
                this.isConnected = false;
            });

            this.mqttClient.on('reconnect', () => {
                console.log('Persistent MQTT connection reconnecting...');
            });
        });
    }

    private handleMessage(topic: string, payload: Buffer): void {
        const subscriptions = this.subscriptions.get(topic);
        if (subscriptions) {
            try {
                const data: TelemetryResponse = JSON.parse(payload.toString());
                subscriptions.forEach(sub => {
                    try {
                        sub.callback(data);
                    } catch (error) {
                        console.error(`Error in subscription callback for ${sub.id}:`, error);
                    }
                });
            } catch (error) {
                console.error(`Error parsing message for topic ${topic}:`, error);
            }
        }
    }

    public async subscribe(topic: string, jwt: string, callback: (data: TelemetryResponse) => void): Promise<() => void> {
        // Ensure we have a connection
        await this.ensureConnection(jwt);

        // Generate unique subscription ID
        const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add subscription to our tracking
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, []);
            
            // Subscribe to the topic on MQTT broker if this is the first subscription
            if (this.mqttClient && this.isConnected) {
                await new Promise<void>((resolve, reject) => {
                    this.mqttClient!.subscribe(topic, (err) => {
                        if (err) {
                            console.error(`Subscription error for topic ${topic}:`, err);
                            reject(err);
                        } else {
                            console.log(`Subscribed to topic: ${topic}`);
                            resolve();
                        }
                    });
                });
            }
        }

        // Add this callback to the topic's subscriptions
        this.subscriptions.get(topic)!.push({
            topic,
            callback,
            id: subscriptionId
        });

        console.log(`Added subscription ${subscriptionId} for topic: ${topic}`);
        console.log(`Total subscriptions for ${topic}: ${this.subscriptions.get(topic)!.length}`);

        // Return cleanup function
        return () => {
            this.unsubscribe(topic, subscriptionId);
        };
    }

    private async unsubscribe(topic: string, subscriptionId: string): Promise<void> {
        const subscriptions = this.subscriptions.get(topic);
        if (!subscriptions) return;

        // Remove the specific subscription
        const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
        if (index !== -1) {
            subscriptions.splice(index, 1);
            console.log(`Removed subscription ${subscriptionId} for topic: ${topic}`);
        }

        // If no more subscriptions for this topic, unsubscribe from MQTT broker
        if (subscriptions.length === 0) {
            this.subscriptions.delete(topic);
            
            if (this.mqttClient && this.isConnected) {
                await new Promise<void>((resolve) => {
                    this.mqttClient!.unsubscribe(topic, (err) => {
                        if (err) {
                            console.error(`Unsubscription error for topic ${topic}:`, err);
                        } else {
                            console.log(`Unsubscribed from topic: ${topic}`);
                        }
                        resolve();
                    });
                });
            }
        }

        console.log(`Remaining subscriptions for ${topic}: ${subscriptions.length}`);
    }

    public async disconnect(): Promise<void> {
        if (this.mqttClient) {
            console.log('Disconnecting persistent MQTT client');
            this.subscriptions.clear();
            this.mqttClient.end();
            this.mqttClient = null;
            this.isConnected = false;
            this.isConnecting = false;
            this.currentJwt = null;
        }
    }

    public getConnectionStatus(): { connected: boolean; connecting: boolean; topicCount: number } {
        return {
            connected: this.isConnected,
            connecting: this.isConnecting,
            topicCount: this.subscriptions.size
        };
    }
}

