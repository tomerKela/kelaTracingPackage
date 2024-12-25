import { captureError } from 'elastic-apm-node';
import { APMCore } from "../core/apm";
import { TransactionTypes } from "../types";

export const createSocketMiddleware = () => {
    const apmCore = APMCore.getInstance();

    return {
        incoming: (socket: any, message: any, next: Function) => {
            try {
                const tracingId = message.headers?.['x-tracing-id'];
                
                if (tracingId) {
                    apmCore.startTransaction(TransactionTypes.SOCKET, tracingId);
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
                    if (!message.headers) {
                        message.headers = {};
                    }
                    message.headers['x-tracing-id'] = traceId;
                }
                
                // End transaction after sending
                const transaction = apmCore.getCurrentTransaction();
                if (transaction) {
                    transaction.end();
                }
                
                return message;
            } catch (error) {
                captureError(error);
                return message;
            }
        }
    };
};
