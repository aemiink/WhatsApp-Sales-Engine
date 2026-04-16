import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { InstagramDataFetcherService } from '../src/instagram-analysis/instagram-data-fetcher.service';
import { InstagramSignalExtractorService } from '../src/instagram-analysis/instagram-signal-extractor.service';
import { WebsiteFetcherService } from '../src/website-analysis/website-fetcher.service';
import { WebsiteParserService } from '../src/website-analysis/website-parser.service';
import { WebsiteSignalExtractorService } from '../src/website-analysis/website-signal-extractor.service';

interface BrandContextRecord {
  id: string;
  workspaceId: string;
  tone: string | null;
  salesStyle: string | null;
  dataJson?: unknown;
  sourceStatusJson?: unknown;
  websiteSignalsJson?: unknown;
  instagramSignalsJson?: unknown;
  resolvedContextJson?: unknown;
  confidenceJson?: unknown;
  lastResolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WebsiteSnapshotRecord {
  id: string;
  workspaceId: string;
  rootUrl: string;
  pagesJson: unknown;
  extractedSignalsJson: unknown;
  confidence: number | null;
  createdAt: Date;
}

interface InstagramSnapshotRecord {
  id: string;
  workspaceId: string;
  instagramHandle: string;
  profileJson: unknown;
  postsJson: unknown;
  extractedSignalsJson: unknown;
  confidence: number | null;
  createdAt: Date;
}

interface TrainingSettingsRecord {
  id: string;
  workspaceId: string;
  productsJson: unknown;
  faqJson: unknown;
  rulesJson: unknown;
  forbiddenResponsesJson: unknown;
  handoffRulesJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}

describe('Brand Context + Training Settings (e2e)', () => {
  let app: INestApplication<App> | undefined;

  const state: {
    sequence: number;
    brandContexts: Map<string, BrandContextRecord>;
    websiteSnapshots: WebsiteSnapshotRecord[];
    instagramSnapshots: InstagramSnapshotRecord[];
    trainingSettings: Map<string, TrainingSettingsRecord>;
  } = {
    sequence: 0,
    brandContexts: new Map<string, BrandContextRecord>(),
    websiteSnapshots: [],
    instagramSnapshots: [],
    trainingSettings: new Map<string, TrainingSettingsRecord>(),
  };

  function nextId(prefix: string): string {
    state.sequence += 1;
    return `${prefix}-${state.sequence}`;
  }

  beforeEach(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.AI_DEFAULT_PROVIDER ??= 'gemini';
    process.env.GEMINI_API_KEY ??= 'test-gemini-key';

    process.env.WHATSAPP_ACCESS_TOKEN ??= 'test-wa-access-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID ??= '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ??= 'test-webhook-token';
    process.env.META_GRAPH_API_VERSION ??= 'v21.0';

    state.sequence = 0;
    state.brandContexts.clear();
    state.websiteSnapshots.length = 0;
    state.instagramSnapshots.length = 0;
    state.trainingSettings.clear();

    const prismaMock = {
      brandContext: {
        findUnique: jest.fn(({ where }: { where: { workspaceId: string } }) =>
          Promise.resolve(state.brandContexts.get(where.workspaceId) ?? null),
        ),
        upsert: jest.fn(
          ({
            where,
            create,
            update,
          }: {
            where: { workspaceId: string };
            create: Partial<BrandContextRecord>;
            update: Partial<BrandContextRecord>;
          }) => {
            const now = new Date();
            const existing = state.brandContexts.get(where.workspaceId);
            if (existing) {
              const merged: BrandContextRecord = {
                ...existing,
                ...update,
                workspaceId: where.workspaceId,
                updatedAt: now,
              };
              state.brandContexts.set(where.workspaceId, merged);
              return Promise.resolve(merged);
            }

            const created: BrandContextRecord = {
              id: nextId('bc'),
              workspaceId: where.workspaceId,
              tone:
                typeof create.tone === 'string'
                  ? create.tone
                  : (create.tone ?? null),
              salesStyle:
                typeof create.salesStyle === 'string'
                  ? create.salesStyle
                  : (create.salesStyle ?? null),
              dataJson: create.dataJson,
              sourceStatusJson: create.sourceStatusJson,
              websiteSignalsJson: create.websiteSignalsJson,
              instagramSignalsJson: create.instagramSignalsJson,
              resolvedContextJson: create.resolvedContextJson,
              confidenceJson: create.confidenceJson,
              lastResolvedAt:
                create.lastResolvedAt instanceof Date
                  ? create.lastResolvedAt
                  : null,
              createdAt: now,
              updatedAt: now,
            };
            state.brandContexts.set(where.workspaceId, created);
            return Promise.resolve(created);
          },
        ),
      },
      websiteAnalysisSnapshot: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<WebsiteSnapshotRecord, 'id' | 'createdAt'>;
          }) => {
            const created: WebsiteSnapshotRecord = {
              id: nextId('web'),
              createdAt: new Date(),
              ...data,
            };
            state.websiteSnapshots.unshift(created);
            return Promise.resolve(created);
          },
        ),
        findFirst: jest.fn(({ where }: { where: { workspaceId: string } }) =>
          Promise.resolve(
            state.websiteSnapshots.find(
              (snapshot) => snapshot.workspaceId === where.workspaceId,
            ) ?? null,
          ),
        ),
      },
      instagramAnalysisSnapshot: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<InstagramSnapshotRecord, 'id' | 'createdAt'>;
          }) => {
            const created: InstagramSnapshotRecord = {
              id: nextId('insta'),
              createdAt: new Date(),
              ...data,
            };
            state.instagramSnapshots.unshift(created);
            return Promise.resolve(created);
          },
        ),
        findFirst: jest.fn(({ where }: { where: { workspaceId: string } }) =>
          Promise.resolve(
            state.instagramSnapshots.find(
              (snapshot) => snapshot.workspaceId === where.workspaceId,
            ) ?? null,
          ),
        ),
      },
      trainingSetting: {
        findUnique: jest.fn(({ where }: { where: { workspaceId: string } }) =>
          Promise.resolve(
            state.trainingSettings.get(where.workspaceId) ?? null,
          ),
        ),
        upsert: jest.fn(
          ({
            where,
            create,
            update,
          }: {
            where: { workspaceId: string };
            create: Partial<TrainingSettingsRecord>;
            update: Partial<TrainingSettingsRecord>;
          }) => {
            const now = new Date();
            const existing = state.trainingSettings.get(where.workspaceId);
            if (existing) {
              const merged: TrainingSettingsRecord = {
                ...existing,
                ...update,
                workspaceId: where.workspaceId,
                updatedAt: now,
              };
              state.trainingSettings.set(where.workspaceId, merged);
              return Promise.resolve(merged);
            }

            const created: TrainingSettingsRecord = {
              id: nextId('ts'),
              workspaceId: where.workspaceId,
              productsJson: create.productsJson ?? [],
              faqJson: create.faqJson ?? [],
              rulesJson: create.rulesJson ?? {},
              forbiddenResponsesJson: create.forbiddenResponsesJson ?? [],
              handoffRulesJson: create.handoffRulesJson ?? [],
              createdAt: now,
              updatedAt: now,
            };
            state.trainingSettings.set(where.workspaceId, created);
            return Promise.resolve(created);
          },
        ),
      },
      whatsAppConnection: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const websiteFetcherMock: Pick<WebsiteFetcherService, 'fetchWebsite'> = {
      fetchWebsite: jest.fn().mockResolvedValue({
        rootUrl: 'https://example.com/',
        pages: [
          {
            url: 'https://example.com/',
            status: 200,
            html: '<html><title>Acme Studio</title></html>',
            error: null,
          },
        ],
        warnings: [],
      }),
    };

    const websiteParserMock: Pick<WebsiteParserService, 'parsePages'> = {
      parsePages: jest.fn().mockReturnValue([
        {
          url: 'https://example.com/',
          title: 'Acme Studio',
          metaDescription: 'Premium handcrafted decor',
          metaKeywords: ['decor', 'premium'],
          headings: ['Premium Decor'],
          textContent: 'Premium decor shop now',
          links: [],
          ctaFragments: ['shop now'],
        },
      ]),
    };

    const websiteSignalExtractorMock: Pick<
      WebsiteSignalExtractorService,
      'extract'
    > = {
      extract: jest.fn().mockReturnValue({
        signals: {
          brandName: 'Acme Studio',
          tagline: 'Premium Decor',
          metaTitle: 'Acme Studio',
          metaDescription: 'Premium handcrafted decor',
          primaryKeywords: ['decor', 'premium'],
          ctaPatterns: ['shop now'],
          toneHints: ['premium'],
          positioningHints: ['premium-positioning'],
          premiumPerception: 'high',
          campaignAggressiveness: 'medium',
          productFocusHints: ['Signature Candle'],
        },
        confidence: 0.83,
        warnings: [],
      }),
    };

    const instagramDataFetcherMock: Pick<
      InstagramDataFetcherService,
      'fetchWorkspaceInstagramData'
    > = {
      fetchWorkspaceInstagramData: jest.fn().mockResolvedValue({
        instagramHandle: 'acmestudio',
        profileJson: {
          bio: 'Premium decor and styling tips',
        },
        postsJson: [
          {
            caption: 'DM us for details #decor',
            hashtags: ['#decor'],
            raw: {},
          },
        ],
        warnings: [],
      }),
    };

    const instagramSignalExtractorMock: Pick<
      InstagramSignalExtractorService,
      'extract'
    > = {
      extract: jest.fn().mockReturnValue({
        signals: {
          username: 'acmestudio',
          bioSummary: 'Premium decor and styling tips',
          toneHints: ['soft-friendly'],
          ctaPatterns: ['dm us'],
          hashtagPatterns: ['#decor'],
          contentStyleHints: ['short-form-caption'],
          salesStyle: 'balanced',
          emojiDensity: 'low',
          consistencyScore: 0.74,
        },
        confidence: 0.72,
        warnings: [],
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(WebsiteFetcherService)
      .useValue(websiteFetcherMock)
      .overrideProvider(WebsiteParserService)
      .useValue(websiteParserMock)
      .overrideProvider(WebsiteSignalExtractorService)
      .useValue(websiteSignalExtractorMock)
      .overrideProvider(InstagramDataFetcherService)
      .useValue(instagramDataFetcherMock)
      .overrideProvider(InstagramSignalExtractorService)
      .useValue(instagramSignalExtractorMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('website analyze creates snapshot and resolves brand context', async () => {
    const analyzeResponse = await request(app!.getHttpServer())
      .post('/brand-context/website/analyze')
      .send({
        workspaceId: 'ws-1',
        websiteUrl: 'https://example.com',
      })
      .expect(201);

    const analyzeBody = analyzeResponse.body as {
      snapshotId: string;
      sourceStatus: { website: { available: boolean } };
      resolvedContext: { brandName: string };
    };

    expect(analyzeBody.snapshotId).toBeTruthy();
    expect(analyzeBody.sourceStatus.website.available).toBe(true);
    expect(analyzeBody.resolvedContext.brandName).toBe('Acme Studio');

    const contextResponse = await request(app!.getHttpServer())
      .get('/brand-context')
      .query({
        workspaceId: 'ws-1',
      })
      .expect(200);

    const contextBody = contextResponse.body as {
      resolvedContext: { brandName: string };
      sourceStatus: { website: { status: string } };
    };

    expect(contextBody.resolvedContext.brandName).toBe('Acme Studio');
    expect(contextBody.sourceStatus.website.status).toBe('ready');
  });

  it('instagram analyze creates snapshot and updates resolved context', async () => {
    const analyzeResponse = await request(app!.getHttpServer())
      .post('/brand-context/instagram/analyze')
      .send({
        workspaceId: 'ws-2',
      })
      .expect(201);

    const analyzeBody = analyzeResponse.body as {
      snapshotId: string;
      sourceStatus: { instagram: { available: boolean } };
      resolvedContext: { toneProfile: { salesStyle: string | null } };
    };

    expect(analyzeBody.snapshotId).toBeTruthy();
    expect(analyzeBody.sourceStatus.instagram.available).toBe(true);
    expect(analyzeBody.resolvedContext.toneProfile.salesStyle).toBe('balanced');
  });

  it('training settings patch updates settings and refreshes context', async () => {
    const patchResponse = await request(app!.getHttpServer())
      .patch('/training-settings')
      .send({
        productsJson: [
          {
            name: 'Consulting Package',
            summary: 'Business consulting',
          },
        ],
        faqJson: [
          {
            question: 'Çalışma saatleriniz nedir?',
            answer: 'Hafta içi 09:00-18:00',
          },
        ],
        rulesJson: {
          targetAudience: 'SMB founders',
          customRules: ['Kısa ve net ol'],
        },
        forbiddenResponsesJson: ['Kesin sonuç garantisi verme'],
        handoffRulesJson: ['Fiyat itirazı artarsa temsilciye aktar'],
      })
      .expect(200);

    const patchBody = patchResponse.body as {
      trainingSettings: { workspaceId: string };
      resolvedContext: { sourceSummary: { manualTrainingAvailable: boolean } };
    };

    expect(patchBody.trainingSettings.workspaceId).toBe('default-workspace');
    expect(
      patchBody.resolvedContext.sourceSummary.manualTrainingAvailable,
    ).toBe(true);

    const readSettings = await request(app!.getHttpServer())
      .get('/training-settings')
      .expect(200);

    const settingsBody = readSettings.body as {
      trainingSettings: { workspaceId: string; faqJson: unknown[] };
    };

    expect(settingsBody.trainingSettings.workspaceId).toBe('default-workspace');
    expect(settingsBody.trainingSettings.faqJson).toHaveLength(1);
  });
});
