import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { envValidationSchema } from '../src/config/env.validation';

describe('Config Validation (integration)', () => {
  const snapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...snapshot };
  });

  it('fails when required WhatsApp config is missing', async () => {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-value';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-value';
    process.env.SECRET_ENCRYPTION_KEY =
      'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
    process.env.AI_DEFAULT_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    process.env.WHATSAPP_ACCESS_TOKEN = '';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'verify-token';
    process.env.META_GRAPH_API_VERSION = 'v21.0';

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            validationSchema: envValidationSchema,
          }),
        ],
      }).compile(),
    ).rejects.toThrow();
  });

  it('fails when production webhook signature requirement is disabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.JWT_ACCESS_SECRET = 'prod-access-secret-value-123';
    process.env.JWT_REFRESH_SECRET = 'prod-refresh-secret-value-456';
    process.env.SECRET_ENCRYPTION_KEY =
      'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
    process.env.APP_ENVIRONMENT = 'production';
    process.env.AI_DEFAULT_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'verify-token';
    process.env.META_GRAPH_API_VERSION = 'v21.0';
    process.env.WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED = 'false';
    process.env.WHATSAPP_ENV_FALLBACK_ENABLED = 'false';
    process.env.INSTAGRAM_ENV_FALLBACK_ENABLED = 'false';
    process.env.WEBHOOK_TEST_TOOL_ENABLED = 'false';

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            validationSchema: envValidationSchema,
          }),
        ],
      }).compile(),
    ).rejects.toThrow();
  });

  it('fails when auth bypass is enabled outside test env', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.JWT_ACCESS_SECRET = 'dev-access-secret-value-123';
    process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret-value-456';
    process.env.SECRET_ENCRYPTION_KEY =
      'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
    process.env.AI_DEFAULT_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'verify-token';
    process.env.META_GRAPH_API_VERSION = 'v21.0';
    process.env.AUTH_BYPASS_IN_TEST = 'true';

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            validationSchema: envValidationSchema,
          }),
        ],
      }).compile(),
    ).rejects.toThrow();
  });
});
