import { TracingConfig } from '../types';
import axios from 'axios';
import { createHttpMiddleware } from '../middleware/http';
import { createRabbitMQMiddleware } from '../middleware/rabbitmq';
import { createSocketMiddleware } from '../middleware/socket';
import { createKafkaMiddleware } from '../middleware/kafka';
import { ProducerRecord, EachMessagePayload, ConsumerSubscribeTopics, ConsumerSubscribeTopic, ConsumerRunConfig } from 'kafkajs';

export const setupTracing = (config: TracingConfig) => {
    const setupResults = {
        http: false,
        rabbitmq: false,
        kafka: false,
        socket: false,
        axios: false
    };

    try {
        // Setup HTTP middleware
        if (config.http?.enabled) {
            const { incoming } = createHttpMiddleware();
            if (config.http.excludePaths) {
                // Implementation for path exclusion
            }
            setupResults.http = true;
        }

        // Setup Axios interceptors
        if (config.axios?.enabled) {
            const { outgoing } = createHttpMiddleware();
            axios.interceptors.request.use(outgoing);
            setupResults.axios = true;
        }

        // Setup RabbitMQ middleware
        if (config.rabbitmq?.enabled && config.rabbitmq.connection) {
            const { incoming, outgoing } = createRabbitMQMiddleware();
            const channel = config.rabbitmq.connection;
            
            const originalConsume = channel.consume.bind(channel);
            channel.consume = (queue: string, callback: Function, options: any) => {
                return originalConsume(queue, (msg: any) => {
                    incoming(msg, () => callback(msg));
                }, options);
            };
            
            const originalPublish = channel.publish.bind(channel);
            channel.publish = (exchange: string, routingKey: string, content: any, options: any = {}) => {
                const enhancedOptions = outgoing({ properties: options });
                return originalPublish(exchange, routingKey, content, enhancedOptions.properties);
            };
            
            setupResults.rabbitmq = true;
        }

        // Setup Socket.IO middleware
        if (config.socket?.enabled && config.socket.io) {
            const { incoming, outgoing } = createSocketMiddleware();
            const io = config.socket.io;
            
            io.use((socket: any, next: Function) => {
                socket.use((packet: any[], nextPacket: Function) => {
                    const [event, message] = packet;
                    incoming(socket, message, nextPacket);
                });
                next();
            });
            
            const originalEmit = io.emit.bind(io);
            io.emit = (event: string, message: any) => {
                const enhancedMessage = outgoing(message);
                return originalEmit(event, enhancedMessage);
            };
            
            setupResults.socket = true;
        }

        if (config.kafka?.enabled) {
            const { consumer, producer } = createKafkaMiddleware();
            
            // Setup producer middleware
            if (config.kafka.producer) {
                const originalSend = config.kafka.producer.send.bind(config.kafka.producer);
                config.kafka.producer.send = async (record: ProducerRecord) => {
                    const enhancedRecord = await producer.enhanceMessage(record);
                    return originalSend(enhancedRecord);
                };
            }
            
            // Setup consumer middleware
            if (config.kafka.consumer) {
                const originalRun = config.kafka.consumer.run.bind(config.kafka.consumer);       
                config.kafka.consumer.run = async (config?: ConsumerRunConfig) => {
                    const originalEachMessage = config.eachMessage.bind(config);
                    config.eachMessage = async (payload: EachMessagePayload) => {
                        await consumer.eachMessage(payload, originalEachMessage);
                    };
                    return originalRun(config);
                };
            }
            
            setupResults.kafka = true;
        }

        return setupResults;
        
    } catch (error) {
        console.error('Error setting up tracing:', error);
        return setupResults;
    }
};
