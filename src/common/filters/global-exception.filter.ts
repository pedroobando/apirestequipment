import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ErrorResponse {
  statusCode: number;
  message: string;
  errorId: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? ((exception.getResponse() as { message?: string | string[] })
            .message ?? exception.message)
        : 'Internal server error';

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      errorId: randomUUID(),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${errorResponse.errorId} - ${exception.message}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
