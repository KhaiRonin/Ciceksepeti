import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppLoggerService } from './logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private isAvailable = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db'),
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    this.client.on('error', (error) => {
      this.isAvailable = false;
      this.logger.warn(
        `Redis unavailable: ${error.message}. Falling back to degraded mode.`,
        RedisService.name,
      );
    });

    this.client.on('ready', () => {
      this.isAvailable = true;
      this.logger.log('Redis connection established.', RedisService.name);
    });

    this.client.on('end', () => {
      this.isAvailable = false;
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.isAvailable = true;
    } catch (error) {
      this.isAvailable = false;
      this.logger.warn(
        `Redis connection failed on startup: ${error instanceof Error ? error.message : String(error)}. Continuing without Redis.`,
        RedisService.name,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.quit();
    } catch {
      // No-op during shutdown in degraded mode.
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable) return null;

    try {
      return await this.client.get(key);
    } catch {
      this.isAvailable = false;
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable) return;

    if (ttlSeconds) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } catch {
        this.isAvailable = false;
      }
      return;
    }

    try {
      await this.client.set(key, value);
    } catch {
      this.isAvailable = false;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.del(key);
    } catch {
      this.isAvailable = false;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailable) return 1;

    try {
      return await this.client.incr(key);
    } catch {
      this.isAvailable = false;
      return 1;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable) return [];

    try {
      return await this.client.keys(pattern);
    } catch {
      this.isAvailable = false;
      return [];
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.expire(key, ttlSeconds);
    } catch {
      this.isAvailable = false;
    }
  }
}
