import * as Joi from 'joi';
import { AI_DEFAULT_PROVIDERS } from './env.types';

const DEV_SECRET_HINTS = [
  'change-me',
  'replace-with',
  'example',
  'test',
  'dev',
];

function isWeakSecret(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return DEV_SECRET_HINTS.some((hint) => normalized.includes(hint));
}

function parseCorsOrigins(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().positive().default(3000),
  APP_VERSION: Joi.string().trim().optional().allow(''),
  APP_ROLE: Joi.string().valid('api', 'worker').default('api'),
  DATABASE_URL: Joi.string().trim().required(),
  DIRECT_URL: Joi.string().trim().required(),
  JWT_ACCESS_SECRET: Joi.string().trim().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().trim().min(16).required(),
  JWT_ACCESS_EXPIRES_IN_SECONDS: Joi.number().integer().min(60).default(900),
  JWT_REFRESH_EXPIRES_IN_SECONDS: Joi.number()
    .integer()
    .min(900)
    .default(604800),
  AUTH_BYPASS_IN_TEST: Joi.boolean().default(false),
  AUTH_ALLOW_DEV_BOOTSTRAP: Joi.boolean().default(false),
  AUTH_RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(30),
  WEBHOOK_RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  WEBHOOK_RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(300),
  CORS_ALLOWED_ORIGINS: Joi.string()
    .trim()
    .default('http://localhost:5173,http://127.0.0.1:5173'),
  CORS_ALLOW_CREDENTIALS: Joi.boolean().default(true),
  TRUST_PROXY: Joi.boolean().default(false),
  API_REQUEST_BODY_LIMIT: Joi.string().trim().default('1mb'),
  SECURITY_HEADERS_ENABLED: Joi.boolean().default(true),
  AI_DEFAULT_PROVIDER: Joi.string()
    .valid(...AI_DEFAULT_PROVIDERS)
    .required(),
  GEMINI_API_KEY: Joi.string()
    .trim()
    .when('AI_DEFAULT_PROVIDER', {
      is: 'gemini',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
  GEMINI_MODEL: Joi.string().trim().default('gemini-1.5-flash'),
  OPENAI_API_KEY: Joi.string()
    .trim()
    .when('AI_DEFAULT_PROVIDER', {
      is: 'openai',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
  OPENAI_MODEL: Joi.string().trim().default('gpt-4o-mini'),
  AI_TIMEOUT_MS: Joi.number().integer().positive().default(12000),
  AI_MAX_RETRIES: Joi.number().integer().min(0).max(3).default(1),
  WHATSAPP_SEND_MAX_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  WHATSAPP_SEND_RETRY_BASE_DELAY_MS: Joi.number()
    .integer()
    .min(100)
    .default(300),
  OUTBOUND_MIN_INTERVAL_MS: Joi.number().integer().min(0).default(700),
  INBOUND_RATE_LIMIT_PER_WINDOW: Joi.number().integer().min(1).default(120),
  INBOUND_RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  EXECUTION_QUEUE_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),
  EXECUTION_QUEUE_RETRY_BASE_DELAY_MS: Joi.number()
    .integer()
    .min(100)
    .default(500),
  QUEUE_DRIVER: Joi.string().valid('memory', 'bullmq').default('memory'),
  REDIS_URL: Joi.string().trim().uri().optional().allow(''),
  QUEUE_PREFIX: Joi.string().trim().default('wse'),
  QUEUE_INLINE_WORKERS: Joi.boolean().default(true),
  QUEUE_INBOUND_CONCURRENCY: Joi.number().integer().min(1).max(100).default(5),
  QUEUE_AI_DECISION_CONCURRENCY: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(3),
  QUEUE_OUTBOUND_CONCURRENCY: Joi.number().integer().min(1).max(100).default(5),
  QUEUE_JOB_REMOVE_ON_COMPLETE: Joi.number().integer().min(0).default(500),
  QUEUE_JOB_REMOVE_ON_FAIL: Joi.number().integer().min(0).default(1000),
  WHATSAPP_ACCESS_TOKEN: Joi.string().trim().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().trim().required(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().trim().optional().allow(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: Joi.string().trim().required(),
  WHATSAPP_APP_SECRET: Joi.string().trim().optional().allow(''),
  WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED: Joi.boolean().default(false),
  WHATSAPP_PROVIDER_TIMEOUT_MS: Joi.number().integer().min(1000).default(12000),
  META_GRAPH_API_VERSION: Joi.string()
    .trim()
    .pattern(/^v\d+\.\d+$/)
    .required(),
  WEBSITE_FETCH_TIMEOUT_MS: Joi.number().integer().min(1000).default(8000),
  WEBSITE_FETCH_MAX_PAGES: Joi.number().integer().min(1).max(10).default(4),
  WEBSITE_FETCH_MAX_RESPONSE_BYTES: Joi.number()
    .integer()
    .min(50_000)
    .max(2_000_000)
    .default(500_000),
  INSTAGRAM_ACCESS_TOKEN: Joi.string().trim().optional().allow(''),
  INSTAGRAM_USER_ID: Joi.string().trim().optional().allow(''),
  INSTAGRAM_GRAPH_API_VERSION: Joi.string()
    .trim()
    .pattern(/^v\d+\.\d+$/)
    .default('v21.0'),
  INSTAGRAM_MEDIA_LIMIT: Joi.number().integer().min(1).max(50).default(20),
  INSTAGRAM_PROVIDER_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .default(12000),
  RESEND_API_KEY: Joi.string().trim().optional().allow(''),
  EMAIL_PROVIDER_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  EMAIL_FROM_ADDRESS: Joi.string().trim().email().optional().allow(''),
  APP_BASE_URL: Joi.string().trim().uri().optional().allow(''),
})
  .custom((value: Record<string, unknown>, helpers) => {
    const nodeEnv = value.NODE_ENV;
    const authBypassInTest = Boolean(value.AUTH_BYPASS_IN_TEST);
    const corsAllowCredentials = Boolean(value.CORS_ALLOW_CREDENTIALS);
    const corsOrigins = parseCorsOrigins(value.CORS_ALLOWED_ORIGINS);
    const signatureRequired = Boolean(
      value.WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED,
    );
    const queueDriver =
      typeof value.QUEUE_DRIVER === 'string' ? value.QUEUE_DRIVER : 'memory';
    const redisUrl =
      typeof value.REDIS_URL === 'string' ? value.REDIS_URL.trim() : '';
    const webhookAppSecret =
      typeof value.WHATSAPP_APP_SECRET === 'string'
        ? value.WHATSAPP_APP_SECRET.trim()
        : '';
    const instagramAccessToken =
      typeof value.INSTAGRAM_ACCESS_TOKEN === 'string'
        ? value.INSTAGRAM_ACCESS_TOKEN.trim()
        : '';
    const instagramUserId =
      typeof value.INSTAGRAM_USER_ID === 'string'
        ? value.INSTAGRAM_USER_ID.trim()
        : '';

    if (authBypassInTest && nodeEnv !== 'test') {
      return helpers.error('any.custom', {
        message:
          'AUTH_BYPASS_IN_TEST can only be enabled when NODE_ENV is test.',
      });
    }

    if (signatureRequired && webhookAppSecret.length < 16) {
      return helpers.error('any.custom', {
        message:
          'WHATSAPP_APP_SECRET must be provided with minimum 16 characters when webhook signature check is enabled.',
      });
    }

    if (corsAllowCredentials && corsOrigins.includes('*')) {
      return helpers.error('any.custom', {
        message:
          'CORS_ALLOWED_ORIGINS cannot include * when CORS_ALLOW_CREDENTIALS is true.',
      });
    }

    if (queueDriver === 'bullmq' && redisUrl.length === 0) {
      return helpers.error('any.custom', {
        message: 'REDIS_URL is required when QUEUE_DRIVER is bullmq.',
      });
    }

    if (nodeEnv === 'production') {
      const accessSecret =
        typeof value.JWT_ACCESS_SECRET === 'string'
          ? value.JWT_ACCESS_SECRET
          : '';
      const refreshSecret =
        typeof value.JWT_REFRESH_SECRET === 'string'
          ? value.JWT_REFRESH_SECRET
          : '';

      if (isWeakSecret(accessSecret) || isWeakSecret(refreshSecret)) {
        return helpers.error('any.custom', {
          message:
            'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not use placeholder/test-style values in production.',
        });
      }

      if (accessSecret === refreshSecret) {
        return helpers.error('any.custom', {
          message:
            'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different in production.',
        });
      }

      if (!signatureRequired) {
        return helpers.error('any.custom', {
          message:
            'WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED must be true in production.',
        });
      }

      if (queueDriver !== 'bullmq') {
        return helpers.error('any.custom', {
          message:
            'QUEUE_DRIVER must be bullmq in production to avoid memory queue data loss.',
        });
      }

      if (redisUrl.length === 0) {
        return helpers.error('any.custom', {
          message: 'REDIS_URL must be configured in production.',
        });
      }

      const appBaseUrl =
        typeof value.APP_BASE_URL === 'string' ? value.APP_BASE_URL : '';
      if (appBaseUrl.length > 0 && !appBaseUrl.startsWith('https://')) {
        return helpers.error('any.custom', {
          message: 'APP_BASE_URL must use https:// in production.',
        });
      }

      if (instagramAccessToken.length === 0 || instagramUserId.length === 0) {
        return helpers.error('any.custom', {
          message:
            'INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID must be configured in production for real Instagram ingestion.',
        });
      }
    }

    return value;
  })
  .messages({
    'any.custom': '{{#message}}',
  })
  .unknown(true);
