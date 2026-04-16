import * as Joi from 'joi';
import { AI_DEFAULT_PROVIDERS } from './env.types';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().positive().default(3000),
  DATABASE_URL: Joi.string().trim().required(),
  DIRECT_URL: Joi.string().trim().required(),
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
  WHATSAPP_ACCESS_TOKEN: Joi.string().trim().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().trim().required(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().trim().optional().allow(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: Joi.string().trim().required(),
  META_GRAPH_API_VERSION: Joi.string()
    .trim()
    .pattern(/^v\d+\.\d+$/)
    .required(),
}).unknown(true);
