import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';
import { SentryService } from '../services/sentry.service';

@Catch()
@Injectable()
export class SentryExceptionFilter extends BaseExceptionFilter {
  constructor(
    httpAdapterHost: HttpAdapterHost,
    private readonly sentryService: SentryService,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType<'http' | 'ws' | 'rpc'>() === 'http') {
      const httpContext = host.switchToHttp();
      const request = httpContext.getRequest<Request | undefined>();
      const statusCode =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const shouldReport = statusCode >= 500;
      if (shouldReport) {
        this.sentryService.captureException(exception, {
          request,
          statusCode,
        });
      }
    } else {
      this.sentryService.captureException(exception);
    }

    super.catch(exception, host);
  }
}
