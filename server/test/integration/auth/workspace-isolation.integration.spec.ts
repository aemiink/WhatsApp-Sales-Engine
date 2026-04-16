import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AnalyticsService } from '../../../src/analytics/analytics.service';
import { asBearer, createAccessToken } from '../../helpers/auth-test.helper';
import { createTestApp } from '../../helpers/test-app.factory';

describe('Workspace isolation (integration)', () => {
  let app: INestApplication<App> | undefined;

  const analyticsServiceMock = {
    getOverview: jest.fn().mockResolvedValue({
      workspaceId: 'ws-a',
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
    getWorkspaceEvents: jest.fn().mockResolvedValue([]),
  } as Pick<AnalyticsService, 'getOverview' | 'getWorkspaceEvents'>;

  beforeEach(async () => {
    const created = await createTestApp({
      env: {
        AUTH_BYPASS_IN_TEST: 'false',
      },
      overrides: [
        {
          token: AnalyticsService,
          useValue: analyticsServiceMock,
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

  it('blocks protected route without bearer token', async () => {
    await request(app!.getHttpServer()).get('/analytics/overview').expect(401);
  });

  it('uses workspace from access token for analytics overview', async () => {
    const token = createAccessToken({
      workspaceId: 'ws-a',
      role: 'admin',
    });

    await request(app!.getHttpServer())
      .get('/analytics/overview')
      .set('Authorization', asBearer(token))
      .expect(200);

    expect(analyticsServiceMock.getOverview).toHaveBeenCalledWith('ws-a');
  });

  it('blocks cross-tenant workspace route access', async () => {
    const token = createAccessToken({
      workspaceId: 'ws-a',
      role: 'admin',
    });

    await request(app!.getHttpServer())
      .get('/analytics/workspace/ws-b/events')
      .set('Authorization', asBearer(token))
      .expect(403);
  });
});
