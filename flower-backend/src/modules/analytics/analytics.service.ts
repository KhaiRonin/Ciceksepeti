import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class AnalyticsService {
  private readonly activeVisitorTtlSeconds = 90;
  private readonly activeVisitorPrefix = 'presence:active:';

  constructor(private readonly redisService: RedisService) {}

  async registerPresence(visitorId: string, path?: string): Promise<void> {
    const sanitizedVisitorId = visitorId.trim();
    if (!sanitizedVisitorId) return;

    const payload = JSON.stringify({
      path: path ?? '/',
      seenAt: new Date().toISOString(),
    });

    await this.redisService.set(
      `${this.activeVisitorPrefix}${sanitizedVisitorId}`,
      payload,
      this.activeVisitorTtlSeconds,
    );
  }

  async removePresence(visitorId: string): Promise<void> {
    const sanitizedVisitorId = visitorId.trim();
    if (!sanitizedVisitorId) return;

    await this.redisService.del(`${this.activeVisitorPrefix}${sanitizedVisitorId}`);
  }

  async getActiveVisitorCount(): Promise<number> {
    const keys = await this.redisService.keys(`${this.activeVisitorPrefix}*`);
    return keys.length;
  }
}
