import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return this.sanitize(value);
  }

  private sanitize(input: unknown): unknown {
    if (typeof input === 'string') {
      return input.replace(/[<>`]/g, '').trim();
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    if (input && typeof input === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitize(value);
      }
      return sanitized;
    }

    return input;
  }
}
