import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AiBrainService } from '../src/ai-brain/ai-brain.service';

describe('AI Decision Endpoint (e2e)', () => {
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
      .overrideProvider(AiBrainService)
      .useValue({
        generateDecision: jest.fn().mockResolvedValue({
          detectedIntent: 'price_inquiry',
          leadStage: 'qualified',
          objectionDetected: null,
          suggestedReply: 'Merhaba, fiyat detaylarını paylaşayım.',
          shouldSendReply: true,
          shouldHandoff: false,
          nextBestAction: 'collect_budget',
          confidence: 0.84,
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

  it('POST /ai/decision/test returns structured decision', async () => {
    const response = await request(app!.getHttpServer())
      .post('/ai/decision/test')
      .send({
        conversationId: 'conv-1',
        messageId: 'msg-1',
      })
      .expect(201);

    const body = response.body as {
      detectedIntent: string;
      leadStage: string;
      shouldSendReply: boolean;
    };

    expect(body.detectedIntent).toBe('price_inquiry');
    expect(body.leadStage).toBe('qualified');
    expect(body.shouldSendReply).toBe(true);
  });
});
