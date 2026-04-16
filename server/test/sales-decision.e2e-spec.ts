import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SalesEngineService } from '../src/sales-engine/sales-engine.service';

describe('Sales Decision Endpoint (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.AI_DEFAULT_PROVIDER ??= 'gemini';
    process.env.GEMINI_API_KEY ??= 'test-gemini-key';
    process.env.GEMINI_MODEL ??= 'gemini-1.5-flash';
    process.env.OPENAI_MODEL ??= 'gpt-4o-mini';
    process.env.AI_TIMEOUT_MS ??= '12000';
    process.env.AI_MAX_RETRIES ??= '1';

    process.env.WHATSAPP_ACCESS_TOKEN ??= 'test-wa-access-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID ??= '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ??= 'test-webhook-token';
    process.env.META_GRAPH_API_VERSION ??= 'v21.0';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SalesEngineService)
      .useValue({
        evaluate: jest.fn(),
        generateDecision: jest.fn().mockResolvedValue({
          intent: 'price_inquiry',
          leadStage: 'qualified',
          objection: null,
          suggestedReply: 'Merhaba, fiyat detaylarını paylaşayım.',
          shouldSendReply: true,
          shouldHandoff: false,
          nextBestAction: 'ask_budget',
          confidence: 0.86,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /sales/decision/test returns final sales decision', async () => {
    const response = await request(app!.getHttpServer())
      .post('/sales/decision/test')
      .send({
        conversationId: 'conv-1',
        messageId: 'msg-1',
      })
      .expect(201);

    const body = response.body as {
      intent: string;
      leadStage: string;
      nextBestAction: string;
    };

    expect(body.intent).toBe('price_inquiry');
    expect(body.leadStage).toBe('qualified');
    expect(body.nextBestAction).toBe('ask_budget');
  });
});
