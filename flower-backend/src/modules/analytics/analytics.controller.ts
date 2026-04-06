import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';
import { PresenceDto } from './dto/presence.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('presence')
  async heartbeat(@Body() dto: PresenceDto) {
    await this.analyticsService.registerPresence(dto.visitorId, dto.path);
    return { ok: true };
  }

  @Public()
  @Post('presence/leave')
  async leave(@Body() dto: PresenceDto) {
    await this.analyticsService.removePresence(dto.visitorId);
    return { ok: true };
  }

  /** Some clients issue GET (e.g. prefetch); avoid noisy 404 in dev tools. */
  @Public()
  @Get('presence/leave')
  async leaveGet(@Query('visitorId') visitorId?: string) {
    if (visitorId) {
      await this.analyticsService.removePresence(visitorId);
    }
    return { ok: true };
  }
}
