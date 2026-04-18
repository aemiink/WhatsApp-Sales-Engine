import { SecretCryptoService } from '../common/services/secret-crypto.service';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../database/prisma.service';
import { InstagramSourceResolutionException } from './errors/instagram-source.errors';
import { InstagramSourceService } from './instagram-source.service';

describe('InstagramSourceService', () => {
  function createService(input?: {
    dbConnection?: {
      id: string;
      workspaceId: string;
      instagramUserId: string;
      username: string | null;
      accessTokenEncrypted: string;
    } | null;
    envFallbackEnabled?: boolean;
    envAccessToken?: string | undefined;
    envUserId?: string | undefined;
    decryptResult?: string;
  }) {
    const prismaMock = {
      instagramConnection: {
        findUnique: jest.fn().mockResolvedValue(input?.dbConnection ?? null),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as PrismaService;

    const appConfigMock = {
      instagramEnvFallbackEnabled: input?.envFallbackEnabled ?? true,
      instagramAccessToken: input?.envAccessToken,
      instagramUserId: input?.envUserId,
    } as AppConfigService;

    const cryptoMock = {
      isEncryptedPayload: jest.fn().mockReturnValue(true),
      decrypt: jest.fn().mockReturnValue(input?.decryptResult ?? 'token'),
      encrypt: jest.fn().mockReturnValue('enc:v1:iv:tag:cipher'),
    } as unknown as SecretCryptoService;

    return {
      service: new InstagramSourceService(
        prismaMock,
        appConfigMock,
        cryptoMock,
      ),
      prismaMock,
      appConfigMock,
      cryptoMock,
    };
  }

  it('resolves workspace scoped source from database', async () => {
    const { service } = createService({
      dbConnection: {
        id: 'ig-1',
        workspaceId: 'ws-1',
        instagramUserId: '17841400000000000',
        username: 'brand',
        accessTokenEncrypted: 'enc:v1:test:test:test',
      },
      decryptResult: 'token-from-db',
    });

    const result = await service.resolveSource('ws-1');

    expect(result).toEqual({
      workspaceId: 'ws-1',
      instagramUserId: '17841400000000000',
      username: 'brand',
      accessToken: 'token-from-db',
      source: 'database',
      warnings: [],
    });
  });

  it('uses env fallback only when enabled', async () => {
    const { service } = createService({
      envFallbackEnabled: true,
      envAccessToken: 'env-token',
      envUserId: '17841411111111111',
    });

    const result = await service.resolveSource('ws-1');

    expect(result.source).toBe('environment');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('throws meaningful error when source is missing and fallback disabled', async () => {
    const { service } = createService({
      envFallbackEnabled: false,
      envAccessToken: undefined,
      envUserId: undefined,
    });

    await expect(service.resolveSource('ws-1')).rejects.toBeInstanceOf(
      InstagramSourceResolutionException,
    );
  });
});
