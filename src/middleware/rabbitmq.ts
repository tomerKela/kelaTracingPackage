import { APMCore } from "../core/apm";
import { TransactionTypes } from "../types";
import { captureError } from 'elastic-apm-node';

export const createRabbitMQMiddleware = () => {
    const apmCore = APMCore.getInstance();

    return {
        incoming: (message: any, next: Function) => {
            try {
                const tracingId = message.properties.headers?.['x-tracing-id'];
                
                if (tracingId) {
                    apmCore.startTransaction(TransactionTypes.RABBIT_MQ, tracingId);
                }
                
                next();
            } catch (error) {
                captureError(error);
                next();
            }
        },
        
        outgoing: (message: any) => {
            try {
                const traceId = apmCore.getTraceId();
                
                if (traceId) {
                    if (!message.properties.headers) {
                        message.properties.headers = {};
                    }
                    message.properties.headers['x-tracing-id'] = traceId;
                }
                
                return message;
            } catch (error) {
                captureError(error);
                return message;
            }
        }
    };
};