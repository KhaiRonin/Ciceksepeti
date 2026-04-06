import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { RedisService } from '../common/services/redis.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `rl:global:${ip}`;
    const limit = this.configService.get<number>('security.rateLimit.limit') ?? 120;
    const ttlMs = this.configService.get<number>('security.rateLimit.ttl') ?? 60_000;
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    const current = await this.redisService.incr(key);
    if (current === 1) {
      await this.redisService.expire(key, ttlSeconds);
    }

    if (current > limit) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
