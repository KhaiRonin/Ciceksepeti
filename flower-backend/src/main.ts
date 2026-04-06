import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import csurf from 'csurf';
import { static as expressStatic } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/global-exception.filter';
import { ResponseSanitizerInterceptor } from './interceptors/response-sanitizer.interceptor';
import { SanitizeInputPipe } from './common/pipes/sanitize.pipe';
import { getUploadsRoot } from './common/utils/uploads-path.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);
  const isProd = configService.get<string>('app.nodeEnv') === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(hpp());
  app.use(compression());
  app.use(cookieParser(configService.get<string>('security.cookieSecret')));
  app.use(morgan(isProd ? 'combined' : 'dev'));
  app.use('/uploads', expressStatic(getUploadsRoot()));

  if (configService.get<boolean>('security.enableCsrf')) {
    app.use(
      csurf({
        cookie: {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
        },
      }),
    );
  }

  app.enableCors({
    origin: configService.get<string>('security.corsOrigin')?.split(',') ?? [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
    new SanitizeInputPipe(),
  );

  app.useGlobalInterceptors(new ResponseSanitizerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(configService));

  app.setGlobalPrefix('api');
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
