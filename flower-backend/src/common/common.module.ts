import { Global, Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { AppLoggerService } from './services/logger.service';
import { AutoTranslationService } from './services/auto-translation.service';

@Global()
@Module({
  providers: [RedisService, AppLoggerService, AutoTranslationService],
  exports: [RedisService, AppLoggerService, AutoTranslationService],
})
export class CommonModule {}
