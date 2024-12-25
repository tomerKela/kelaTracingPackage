import { NextFunction, Request, Response } from "express";
import { APMCore } from "../core/apm";
import { captureError } from 'elastic-apm-node';

export const createErrorHandler = () => {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
        try {
            // Capture error in APM
            captureError(error);
            
            // End current transaction if exists
            const transaction = APMCore.getInstance().getCurrentTransaction();
            if (transaction) {
                transaction.end();
            }
            
            // Forward to next error handler
            next(error);
        } catch (e) {
            // In case of error in error handler, forward original error
            next(error);
        }
    };
};
