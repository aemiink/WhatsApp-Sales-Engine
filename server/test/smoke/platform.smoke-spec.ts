import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { InboundEventQueueService } from '../../src/execution/services/inbound-event-queue.service';
import { asBearer, createAccessToken } from '../helpers/auth-test.helper';
import { createTestApp } from '../helpers/test-app.factory';

describe('Platform smoke checks', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    const created = await createTestApp({
      env: {
        AUTH_BYPASS_IN_TEST: 'false',
      },
      overrides: [
        {
          token: AnalyticsService,
          useValue: {
            getOverview: jest.fn().mockResolvedValue({
              workspaceId: 'default-workspace',
              totals: {
                messages: 0,
                conversations: 0,
              },
              rates: {
                aiResponseRate: 0,
                humanTakeoverRate: 0,
                conversionToHotRate: 0,
              },
              avgResponseTimeSeconds: 0,
              generatedAt: new Date('2026-04-16T00:00:00.000Z').toISOString(),
            }),
          },
        },
      ],
    });

    app = created.app;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('health and version endpoints return 200', async () => {
    await request(app!.getHttpServer()).get('/health').expect(200);
    await request(app!.getHttpServer()).get('/version').expect(200);
  });

  it('webhook verify endpoint accepts configured token', async () => {
    const verifyToken = encodeURIComponent(
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? 'test-webhook-token',
    );

    await request(app!.getHttpServer())
      .get(
        `/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=abc123`,
      )
      .expect(200)
      .expect('abc123');
  });

  it('protected analytics endpoint is reachable with bearer token', async () => {
    const token = createAccessToken({
      workspaceId: 'default-workspace',
      role: 'admin',
    });

    await request(app!.getHttpServer())
      .get('/analytics/overview')
      .set('Authorization', asBearer(token))
      .expect(200);
  });

  it('queue service is available and reports stats', () => {
    const queueService = app!.get(InboundEventQueueService);

    expect(queueService.getStats()).toEqual({
      inFlight: 0,
      completed: 0,
    });
  });
});
