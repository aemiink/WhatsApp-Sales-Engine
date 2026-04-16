import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { AppModule } from '../src/app.module';

describe('Analytics Endpoints (e2e)', () => {
  let app: INestApplication<App> | undefined;

  const analyticsServiceMock = {
    trackEvent: jest.fn(),
    getWorkspaceEvents: jest.fn(),
    getOverview: jest.fn(),
    getFunnel: jest.fn(),
    getConversationMetrics: jest.fn(),
    getAiPerformance: jest.fn(),
  } as Pick<
    AnalyticsService,
    | 'trackEvent'
    | 'getWorkspaceEvents'
    | 'getOverview'
    | 'getFunnel'
    | 'getConversationMetrics'
    | 'getAiPerformance'
  >;

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

    analyticsServiceMock.trackEvent = jest.fn().mockResolvedValue({
      id: 'evt-1',
      workspaceId: 'ws-1',
      conversationId: 'conv-1',
      type: 'message_received',
    });
    analyticsServiceMock.getWorkspaceEvents = jest.fn().mockResolvedValue([]);
    analyticsServiceMock.getOverview = jest.fn().mockResolvedValue({
      workspaceId: 'ws-1',
      totals: {
        messages: 12,
        conversations: 4,
      },
      rates: {
        aiResponseRate: 0.75,
        humanTakeoverRate: 0.25,
        conversionToHotRate: 0.5,
      },
      avgResponseTimeSeconds: 18,
      generatedAt: new Date('2026-04-16T20:00:00.000Z').toISOString(),
    });
    analyticsServiceMock.getFunnel = jest.fn().mockResolvedValue({
      workspaceId: 'ws-1',
      stages: {
        new: 10,
        qualified: 6,
        hot: 3,
        closed: 2,
      },
      conversionRates: {
        newToQualified: 0.6,
        qualifiedToHot: 0.5,
        hotToClosed: 0.6667,
      },
      dropOffRates: {
        newToQualified: 0.4,
        qualifiedToHot: 0.5,
        hotToClosed: 0.3333,
      },
      generatedAt: new Date('2026-04-16T20:00:00.000Z').toISOString(),
    });
    analyticsServiceMock.getConversationMetrics = jest.fn().mockResolvedValue({
      workspaceId: 'ws-1',
      totalConversations: 4,
      activeConversations: 3,
      closedConversations: 1,
      totalMessages: 20,
      avgMessagesPerConversation: 5,
      avgResponseTimeSeconds: 22,
      generatedAt: new Date('2026-04-16T20:00:00.000Z').toISOString(),
    });
    analyticsServiceMock.getAiPerformance = jest.fn().mockResolvedValue({
      workspaceId: 'ws-1',
      counts: {
        aiDecisionCount: 9,
        replySentCount: 7,
        replySkippedCount: 2,
        handoffStartedCount: 1,
      },
      rates: {
        aiReplySuccessRate: 0.7778,
        handoffFrequency: 0.1111,
      },
      avgConfidence: 0.71,
      generatedAt: new Date('2026-04-16T20:00:00.000Z').toISOString(),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AnalyticsService)
      .useValue(analyticsServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /analytics/events tracks event', async () => {
    const response = await request(app!.getHttpServer())
      .post('/analytics/events')
      .send({
        workspaceId: 'ws-1',
        conversationId: 'conv-1',
        type: 'message_received',
        payloadJson: {
          messageId: 'msg-1',
        },
      })
      .expect(201);

    expect((response.body as { id: string }).id).toBe('evt-1');
  });

  it('GET /analytics/overview and /analytics/funnel return metrics', async () => {
    const overview = await request(app!.getHttpServer())
      .get('/analytics/overview?workspaceId=ws-1')
      .expect(200);

    const funnel = await request(app!.getHttpServer())
      .get('/analytics/funnel?workspaceId=ws-1')
      .expect(200);

    expect(
      (overview.body as { totals: { messages: number } }).totals.messages,
    ).toBe(12);
    expect((funnel.body as { stages: { hot: number } }).stages.hot).toBe(3);
  });

  it('GET /analytics/conversations and /analytics/ai return analytics details', async () => {
    const conversationMetrics = await request(app!.getHttpServer())
      .get('/analytics/conversations?workspaceId=ws-1')
      .expect(200);

    const aiMetrics = await request(app!.getHttpServer())
      .get('/analytics/ai?workspaceId=ws-1')
      .expect(200);

    expect(
      (conversationMetrics.body as { totalConversations: number })
        .totalConversations,
    ).toBe(4);
    expect((aiMetrics.body as { avgConfidence: number }).avgConfidence).toBe(
      0.71,
    );
  });
});
