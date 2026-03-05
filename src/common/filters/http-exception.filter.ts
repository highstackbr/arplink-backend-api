import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException ? exception.message : 'Internal server error';

    const requestId = (request as any).requestId;
    if (!isHttpException) {
      const err = exception as any;
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          kind: 'unhandled_exception',
          requestId,
          method: request.method,
          path: request.originalUrl,
          errorName: err?.name,
          errorCode: err?.code,
          errorMessage: typeof err?.message === 'string' ? err.message : String(err),
        }),
      );
    }
    response.status(status).json({
      error: {
        message,
        status,
        requestId,
      },
    });
  }
}

