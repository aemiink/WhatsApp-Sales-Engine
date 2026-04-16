import * as Joi from 'joi';
import { AI_DEFAULT_PROVIDERS } from './env.types';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().positive().default(3000),
  APP_VERSION: Joi.string().trim().optional().allow(''),
  DATABASE_URL: Joi.string().trim().required(),
  DIRECT_URL: Joi.string().trim().required(),
  JWT_ACCESS_SECRET: Joi.string()
    .trim()
    .min(16)
    .default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: Joi.string()
    .trim()
    .min(16)
    .default('dev-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN_SECONDS: Joi.number().integer().min(60).default(900),
  JWT_REFRESH_EXPIRES_IN_SECONDS: Joi.number()
    .integer()
    .min(900)
    .default(604800),
  AUTH_BYPASS_IN_TEST: Joi.boolean().default(true),
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
  WHATSAPP_ACCESS_TOKEN: Joi.string().trim().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().trim().required(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().trim().optional().allow(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: Joi.string().trim().required(),
  META_GRAPH_API_VERSION: Joi.string()
    .trim()
    .pattern(/^v\d+\.\d+$/)
    .required(),
  RESEND_API_KEY: Joi.string().trim().optional().allow(''),
  EMAIL_FROM_ADDRESS: Joi.string().trim().email().optional().allow(''),
  APP_BASE_URL: Joi.string().trim().uri().optional().allow(''),
}).unknown(true);
