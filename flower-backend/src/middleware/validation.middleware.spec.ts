import { BadRequestException } from '@nestjs/common';
import { ValidationMiddleware } from './validation.middleware';

describe('ValidationMiddleware', () => {
  const middleware = new ValidationMiddleware();

  function run(req: { method: string; headers: Record<string, string | undefined>; body?: unknown }) {
    const next = jest.fn();
    middleware.use(req as any, {} as any, next);
    return next;
  }

  it('allows application/json on write methods', () => {
    const next = run({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows multipart/form-data on write methods', () => {
    const next = run({
      method: 'PATCH',
      headers: { 'content-type': 'multipart/form-data; boundary=abc123' },
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported content types on write methods', () => {
    expect(() => {
      run({
        method: 'PUT',
        headers: { 'content-type': 'text/plain', 'content-length': '4' },
        body: { a: 1 },
      });
    }).toThrow(BadRequestException);
  });

  it('allows bodyless write requests without content type', () => {
    const next = run({
      method: 'POST',
      headers: {},
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not enforce content type on read methods', () => {
    const next = run({
      method: 'GET',
      headers: {},
    });

    expect(next).toHaveBeenCalledTimes(1);
  });
});