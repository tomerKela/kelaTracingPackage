# @kela/apm-tracing

A comprehensive APM tracing solution for Node.js applications using Express, NestJS, Socket.IO, and RabbitMQ.

## Installation

```bash
npm install @kela/apm-tracing
```

## Configuration

### TypeScript Configuration
Add the following to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSourceMap": false,
    "inlineSources": true
  }
}
```
This configuration ensures proper source map handling for APM error tracking.

## Basic Usage

### Initialize APM
```typescript
import { APMCore } from '@kela/apm-tracing';

// Initialize APM in your app's bootstrap
const apm = APMCore.getInstance();
apm.startAPM({
  serviceName: 'your-service-name',
  environment: 'production',
  // other elastic APM options
});
```

### Express Application
```typescript
import { setupTracing, createErrorHandler } from '@kela/apm-tracing';
import express from 'express';

const app = express();

// Setup tracing middleware
setupTracing({
  http: {
    enabled: true,
    excludePaths: ['/health']
  },
  axios: {
    enabled: true
  }
});

// Add error handler (after your routes, before other error handlers)
app.use(createErrorHandler());
```

### NestJS Application
```typescript
import { setupTracing, createNestErrorFilter } from '@kela/apm-tracing';
import { NestFactory } from '@nestjs/core';
import { APP_FILTER } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup tracing
  setupTracing({
    http: {
      enabled: true,
      excludePaths: ['/health']
    },
    axios: {
      enabled: true
    }
  });

  await app.listen(3000);
}

// In your app.module.ts
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: createNestErrorFilter(),
    },
  ],
})
export class AppModule {}
```

### RabbitMQ Integration
```typescript
import { setupTracing } from '@kela/apm-tracing';
import * as amqp from 'amqplib';

async function setupRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  setupTracing({
    rabbitmq: {
      enabled: true,
      connection: channel
    }
  });
}
```

### Kafka Integration
```typescript
import { Kafka } from 'kafkajs';
import { setupTracing } from '@your-company/apm-tracing';

async function setupKafka() {
    const kafka = new Kafka({
        clientId: 'my-app',
        brokers: ['localhost:9092']
    });

    const producer = kafka.producer();
    const consumer = kafka.consumer({ groupId: 'my-group' });

    await producer.connect();
    await consumer.connect();

    setupTracing({
        kafka: {
            enabled: true,
            producer,
            consumer
        }
    });
}
```

### Socket.IO Integration
```typescript
import { setupTracing } from '@kela/apm-tracing';
import { Server } from 'socket.io';

const io = new Server(httpServer);

setupTracing({
  socket: {
    enabled: true,
    io
  }
});
```

## Error Capturing

The package automatically captures errors and sends them to APM. You can also manually capture errors:

```typescript
import { captureError } from '@kela/apm-tracing';

try {
  // your code
} catch (error) {
  captureError(error);
  throw error; // re-throw if needed
}
```

## API Reference

### APMCore
- `getInstance()`: Get the singleton instance
- `startAPM(options)`: Initialize APM with configuration
- `startTransaction(type, traceID?)`: Start a new transaction
- `getTraceId()`: Get current trace ID
- `isStarted()`: Check if APM is initialized

### Setup Functions
- `setupTracing(config)`: Configure tracing middleware
- `createErrorHandler()`: Create Express error handling middleware
- `createNestErrorFilter()`: Create NestJS error filter

### Transaction Types
```typescript
enum TransactionTypes {
  HTTP = 'HTTP',
  SOCKET = 'SOCKET',
  RABBIT_MQ = 'RABBIT_MQ',
  KAFKA = 'KAFKA'
}
```

## Configuration Options

```typescript
interface TracingConfig {
  http?: {
    enabled: boolean;
    excludePaths?: string[];
  };
  rabbitmq?: {
    enabled: boolean;
    connection: any;
  };
  socket?: {
    enabled: boolean;
    io: any;
  };
  axios?: {
    enabled: boolean;
  };
}
```

## Best Practices

1. Initialize APM as early as possible in your application
2. Always configure source maps correctly
3. Use the error handling middleware/filter last in your middleware chain
4. Check the return value of `setupTracing()` to ensure all integrations are working

## Support
Contact the DevOps team for support and configuration assistance.