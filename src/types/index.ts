import { AgentConfigOptions, TransactionOptions } from 'elastic-apm-node';

export interface TracingConfig {
    http?: {
        enabled: boolean;
        excludePaths?: string[];
    };
    rabbitmq?: {
        enabled: boolean;
        connection: any; // Replace with proper RabbitMQ types
    };
    socket?: {
        enabled: boolean;
        io: any; // Replace with proper Socket.IO types
    };
    axios?: {
        enabled: boolean;
    };
}

export enum TransactionTypes {
    HTTP = 'HTTP',
    SOCKET = 'SOCKET',
    RABBIT_MQ = 'RABBIT_MQ',
    KAFKA = 'KAFKA',
}
