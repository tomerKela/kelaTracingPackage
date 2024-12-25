import { Request, Response, NextFunction } from 'express';
import { APMCore } from '../core/apm';
import { TransactionTypes } from '../types';
import { captureError } from 'elastic-apm-node';

export const createHttpMiddleware = () => {
    const apmCore = APMCore.getInstance();

    return {
        incoming: (req: Request, res: Response, next: NextFunction) => {
            try {
                const tracingId = req.headers['x-tracing-id'];
                
                if (typeof tracingId === 'string') {
                    apmCore.startTransaction(TransactionTypes.HTTP, tracingId);
                }
                
                // Add trace ID to response headers
                const currentTraceId = apmCore.getTraceId();
                if (currentTraceId) {
                    res.setHeader('x-tracing-id', currentTraceId);
                }

                // End transaction when response ends
                res.on('finish', () => {
                    const transaction = apmCore.getCurrentTransaction();
                    if (transaction) {
                        transaction.end();
                    }
                });
                
                next();
            } catch (error) {
                captureError(error);
                next();
            }
        },
        
        outgoing: (config: any) => {
            try {
                const traceId = apmCore.getTraceId();
                
                if (traceId) {
                    if (!config.headers) {
                        config.headers = {};
                    }
                    config.headers['x-tracing-id'] = traceId;
                }
                
                return config;
            } catch (error) {
                captureError(error);
                return config;
            }
        }
    };
};
