import * as Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('', null),
  REDIS_DB: Joi.number().default(0),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().required(),
  COOKIE_SECRET: Joi.string().min(16).required(),
  ENABLE_CSRF: Joi.boolean().truthy('true').falsy('false').default(false),
  RATE_LIMIT_TTL_MS: Joi.number().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().default(120),
  PAYMENT_PROVIDER: Joi.string().default('PAYTR'),
  PAYTR_MERCHANT_ID: Joi.string().allow('', null),
  PAYTR_MERCHANT_KEY: Joi.string().allow('', null),
  PAYTR_MERCHANT_SALT: Joi.string().allow('', null),
  PAYTR_OK_URL: Joi.string().uri().allow('', null),
  PAYTR_FAIL_URL: Joi.string().uri().allow('', null),
  PAYTR_CALLBACK_URL: Joi.string().uri().allow('', null),
  PAYTR_TIMEOUT_LIMIT: Joi.number().default(30),
  PAYTR_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),
  PAYTR_TEST_MODE: Joi.boolean().truthy('true').falsy('false').default(true),
});

export const validateEnv = (config: Record<string, unknown>): Record<string, unknown> => {
  const { error, value } = envSchema.validate(config, { abortEarly: false, allowUnknown: true });
  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
  return value;
};
