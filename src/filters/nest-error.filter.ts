import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { APMCore } from '../core/apm';
import { captureError } from 'elastic-apm-node';

@Catch()
export class NestErrorFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // Capture error in APM
        captureError(exception);

        // End current transaction if exists
        const transaction = APMCore.getInstance().getCurrentTransaction();
        if (transaction) {
            transaction.end();
        }

        // Get status code
        const status = 
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Forward error response
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}