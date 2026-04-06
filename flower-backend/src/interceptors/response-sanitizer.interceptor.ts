import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

const SENSITIVE_FIELDS = ['password', 'hashedRefreshToken'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

@Injectable()
export class ResponseSanitizerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.sanitize(data)));
  }

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    // Keep class instances (Date, Decimal, etc.) intact so JSON serialization stays correct.
    if (isPlainObject(value)) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value)) {
        if (!SENSITIVE_FIELDS.includes(key)) {
          sanitized[key] = this.sanitize(nested);
        }
      }
      return sanitized;
    }

    return value;
  }
}
