import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { envValidationSchema } from '../src/config/env.validation';

describe('Config Validation (integration)', () => {
  it('fails when required WhatsApp config is missing', async () => {
    const snapshot = { ...process.env };

    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL =
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
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

    process.env = snapshot;
  });
});
