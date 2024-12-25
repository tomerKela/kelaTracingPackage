import { APMCore } from '../core/apm';
import { TransactionTypes } from '../types';
import { EachMessagePayload, ProducerRecord, Message } from 'kafkajs';
import { captureError } from 'elastic-apm-node';

export const createKafkaMiddleware = () => {
    const apmCore = APMCore.getInstance();

    return {
        consumer: {
            async eachMessage(payload: EachMessagePayload, originalCallback: (payload: EachMessagePayload) => Promise<void>) {
                try {
                    const tracingId = payload.message.headers?.['x-tracing-id']?.toString();
                    
                    if (tracingId) {
                        apmCore.startTransaction(TransactionTypes.KAFKA, tracingId);
                    }

                    // Execute original callback
                    await originalCallback(payload);

                    // End transaction after processing
                    const transaction = apmCore.getCurrentTransaction();
                    if (transaction) {
                        transaction.end();
                    }
                } catch (error) {
                    captureError(error);
                    throw error; // Re-throw to trigger Kafka retry mechanism
                }
            }
        },

        producer: {
            async enhanceMessage(record: ProducerRecord): Promise<ProducerRecord> {
                try {
                    const traceId = apmCore.getTraceId();
                    
                    if (traceId) {
                        // Ensure messages array exists
                        record.messages = record.messages || [];
                        
                        // Add tracing header to each message
                        record.messages = record.messages.map(message => ({
                            ...message,
                            headers: {
                                ...message.headers,
                                'x-tracing-id': traceId
                            }
                        }));
                    }
                    
                    return record;
                } catch (error) {
                    captureError(error);
                    return record;
                }
            }
        }
    };
};