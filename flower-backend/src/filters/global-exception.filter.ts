import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isProd = this.configService.get<string>('app.nodeEnv') === 'production';

    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2003') {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'İlişkili kayıtlar olduğu için bu işlem gerçekleştirilemedi.',
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : isProd
          ? 'Internal server error'
          : 'Unhandled exception';

    // Always emit message as a string so clients can safely use it
    const message: string =
      typeof rawResponse === 'string'
        ? rawResponse
        : typeof (rawResponse as any)?.message === 'string'
          ? (rawResponse as any).message
          : Array.isArray((rawResponse as any)?.message)
            ? (rawResponse as any).message.join(', ')
            : JSON.stringify(rawResponse);

    if (!isProd) {
      this.logger.error(exception);
    } else {
      this.logger.error(`${request.method} ${request.url} -> ${status}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error:
        typeof rawResponse === 'object' && (rawResponse as any)?.error
          ? (rawResponse as any).error
          : undefined,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
