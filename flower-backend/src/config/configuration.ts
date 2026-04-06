export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    logLevel: process.env.LOG_LEVEL ?? 'info',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB ?? 0),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    cookieSecret: process.env.COOKIE_SECRET ?? 'change-me',
    enableCsrf: process.env.ENABLE_CSRF === 'true',
    rateLimit: {
      ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60000),
      limit: Number(process.env.RATE_LIMIT_LIMIT ?? 120),
    },
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER ?? 'PAYTR',
    paytr: {
      merchantId: process.env.PAYTR_MERCHANT_ID ?? '',
      merchantKey: process.env.PAYTR_MERCHANT_KEY ?? '',
      merchantSalt: process.env.PAYTR_MERCHANT_SALT ?? '',
      okUrl: process.env.PAYTR_OK_URL ?? '',
      failUrl: process.env.PAYTR_FAIL_URL ?? '',
      callbackUrl: process.env.PAYTR_CALLBACK_URL ?? '',
      timeoutLimit: Number(process.env.PAYTR_TIMEOUT_LIMIT ?? 30),
      debug: process.env.PAYTR_DEBUG === 'true',
      testMode: process.env.PAYTR_TEST_MODE !== 'false',
    },
  },
});
