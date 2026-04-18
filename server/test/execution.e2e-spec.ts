import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AiModeService } from '../src/execution/services/ai-mode.service';
import { ExecutionService } from '../src/execution/services/execution.service';

describe('Execution Endpoints (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.SECRET_ENCRYPTION_KEY ??=
      'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
    process.env.AI_DEFAULT_PROVIDER ??= 'gemini';
    process.env.GEMINI_API_KEY ??= 'test-gemini-key';
    process.env.GEMINI_MODEL ??= 'gemini-1.5-flash';
    process.env.OPENAI_MODEL ??= 'gpt-4o-mini';
    process.env.AI_TIMEOUT_MS ??= '12000';
    process.env.AI_MAX_RETRIES ??= '1';
    process.env.WHATSAPP_ACCESS_TOKEN ??= 'test-wa-access-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID ??= '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ??= 'test-webhook-token';
    process.env.WHATSAPP_ENV_FALLBACK_ENABLED ??= 'true';
    process.env.META_GRAPH_API_VERSION ??= 'v21.0';
    process.env.INSTAGRAM_ENV_FALLBACK_ENABLED ??= 'true';
    process.env.SENTRY_ENABLED ??= 'false';
    process.env.SWAGGER_ENABLED ??= 'false';
    process.env.WEBHOOK_TEST_TOOL_ENABLED ??= 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ExecutionService)
      .useValue({
        manualSend: jest.fn().mockResolvedValue({
          sent: true,
          skipped: false,
        }),
        startManualHandoff: jest.fn().mockResolvedValue({
          handoffSessionId: 'hs-1',
          aiMode: 'paused',
          alreadyActive: false,
        }),
        endManualHandoff: jest.fn().mockResolvedValue({
          handoffSessionId: 'hs-1',
          ended: true,
          aiMode: 'auto_reply',
        }),
      })
      .overrideProvider(AiModeService)
      .useValue({
        setMode: jest.fn().mockResolvedValue({
          conversationId: 'conv-1',
          mode: 'paused',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('PATCH /conversations/:id/ai-mode updates mode', async () => {
    const response = await request(app!.getHttpServer())
      .patch('/conversations/conv-1/ai-mode')
      .send({ mode: 'paused' })
      .expect(200);

    expect((response.body as { mode: string }).mode).toBe('paused');
  });

  it('POST /conversations/:id/send sends manual message', async () => {
    const response = await request(app!.getHttpServer())
      .post('/conversations/conv-1/send')
      .send({ text: 'Merhaba' })
      .expect(201);

    expect((response.body as { sent: boolean }).sent).toBe(true);
  });

  it('POST /conversations/:id/handoff starts and ends handoff', async () => {
    const startResponse = await request(app!.getHttpServer())
      .post('/conversations/conv-1/handoff')
      .send({})
      .expect(201);

    expect((startResponse.body as { aiMode: string }).aiMode).toBe('paused');

    const endResponse = await request(app!.getHttpServer())
      .post('/conversations/conv-1/handoff/end')
      .send({ resumeMode: 'auto_reply' })
      .expect(201);

    expect((endResponse.body as { ended: boolean }).ended).toBe(true);
  });
});
