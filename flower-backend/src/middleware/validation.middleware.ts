import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const writeMethods = ['POST', 'PUT', 'PATCH'];
    if (writeMethods.includes(req.method)) {
      const contentType = req.headers['content-type'];
      const isJson = !!contentType && contentType.includes('application/json');
      const isMultipart = !!contentType && contentType.includes('multipart/form-data');
      const isFormUrlEncoded = !!contentType && contentType.includes('application/x-www-form-urlencoded');

      const contentLengthHeader = req.headers['content-length'];
      const parsedLength = typeof contentLengthHeader === 'string' ? Number.parseInt(contentLengthHeader, 10) : NaN;
      const hasBodyByLength = Number.isFinite(parsedLength) && parsedLength > 0;
      const hasBodyByTransferEncoding = typeof req.headers['transfer-encoding'] === 'string';
      const hasBodyByParsedObject = !!req.body
        && typeof req.body === 'object'
        && Object.keys(req.body as Record<string, unknown>).length > 0;
      const hasPayload = hasBodyByLength || hasBodyByTransferEncoding || hasBodyByParsedObject;

      if (hasPayload && !isJson && !isMultipart && !isFormUrlEncoded) {
        throw new BadRequestException(
          'Content-Type must be application/json, multipart/form-data or application/x-www-form-urlencoded',
        );
      }
    }

    next();
  }
}
