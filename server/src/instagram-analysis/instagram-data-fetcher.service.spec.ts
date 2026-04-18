import { AppConfigService } from '../config/app-config.service';
import { InstagramDataFetcherService } from './instagram-data-fetcher.service';
import {
  InstagramSourceService,
  ResolvedInstagramSource,
} from './instagram-source.service';

function mockJsonResponse(
  payload: unknown,
  status = 200,
): Pick<Response, 'ok' | 'status' | 'json'> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  };
}

describe('InstagramDataFetcherService', () => {
  const originalFetch = global.fetch;

  function createSourceServiceMock(
    overrides?: Partial<ResolvedInstagramSource>,
  ): Pick<InstagramSourceService, 'resolveSource'> {
    return {
      resolveSource: jest.fn().mockResolvedValue({
        workspaceId: 'ws-1',
        instagramUserId: '17841400000000000',
        username: null,
        accessToken: 'ig-token',
        source: 'database',
        warnings: [],
        ...overrides,
      }),
    };
  }

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('keeps source warnings in response payload', async () => {
    const service = new InstagramDataFetcherService(
      {
        instagramGraphApiVersion: 'v21.0',
        instagramMediaLimit: 20,
        instagramProviderTimeoutMs: 5000,
      } as AppConfigService,
      createSourceServiceMock({
        source: 'environment',
        warnings: ['Using environment fallback for Instagram source.'],
      }) as InstagramSourceService,
    );

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: '17841400000000000',
          username: 'brand_fallback',
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          data: [],
        }),
      ) as typeof fetch;

    const result = await service.fetchWorkspaceInstagramData('ws-1', '@brand');

    expect(result.instagramHandle).toBe('brand');
    expect(result.profileJson).toMatchObject({
      username: 'brand',
      instagramUserId: '17841400000000000',
    });
    expect(result.postsJson).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Using environment fallback for Instagram source.',
      ]),
    );
  });

  it('fetches profile and media from graph api and extracts captions', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: '17841400000000000',
          username: 'brand_official',
          biography: 'Premium coffee and desserts',
          followers_count: 13450,
          media_count: 2,
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          data: [
            {
              id: 'm1',
              caption: 'Yeni sezon basladi #kahve #istanbul',
            },
            {
              id: 'm2',
              caption: 'Bugun kahve bizden #kahve',
            },
          ],
        }),
      ) as typeof fetch;

    const service = new InstagramDataFetcherService(
      {
        instagramGraphApiVersion: 'v21.0',
        instagramMediaLimit: 20,
        instagramProviderTimeoutMs: 5000,
      } as AppConfigService,
      createSourceServiceMock() as InstagramSourceService,
    );

    const result = await service.fetchWorkspaceInstagramData('ws-1');

    expect(result.instagramHandle).toBe('brand_official');
    expect(result.profileJson).toMatchObject({
      username: 'brand_official',
      bio: 'Premium coffee and desserts',
      followers: 13450,
      mediaCount: 2,
      instagramUserId: '17841400000000000',
    });
    expect(result.postsJson).toHaveLength(2);
    expect(result.postsJson[0].hashtags).toEqual(['#kahve', '#istanbul']);
    expect(result.warnings).toEqual([]);
  });

  it('adds warnings when graph api returns an error payload', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse(
          {
            error: {
              message: 'Invalid OAuth access token.',
            },
          },
          400,
        ),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          data: [],
        }),
      ) as typeof fetch;

    const service = new InstagramDataFetcherService(
      {
        instagramGraphApiVersion: 'v21.0',
        instagramMediaLimit: 20,
        instagramProviderTimeoutMs: 5000,
      } as AppConfigService,
      createSourceServiceMock() as InstagramSourceService,
    );

    const result = await service.fetchWorkspaceInstagramData('ws-1');

    expect(result.profileJson).toEqual({});
    expect(result.postsJson).toEqual([]);
    expect(result.warnings.join(' | ')).toContain(
      'Instagram profile fetch failed',
    );
    expect(result.warnings.join(' | ')).toContain('No Instagram captions');
  });
});
