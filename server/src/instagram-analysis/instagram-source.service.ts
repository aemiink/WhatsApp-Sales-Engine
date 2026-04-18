import { Injectable, Logger } from '@nestjs/common';
import {
  CryptoErrorCode,
  CryptoOperationException,
} from '../common/errors/crypto.errors';
import { SecretCryptoService } from '../common/services/secret-crypto.service';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../database/prisma.service';
import { InstagramSourceResolutionException } from './errors/instagram-source.errors';

export interface ResolvedInstagramSource {
  workspaceId: string;
  instagramUserId: string;
  username: string | null;
  accessToken: string;
  source: 'database' | 'environment';
  warnings: string[];
}

@Injectable()
export class InstagramSourceService {
  private readonly logger = new Logger(InstagramSourceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
    private readonly secretCryptoService: SecretCryptoService,
  ) {}

  async resolveSource(workspaceId: string): Promise<ResolvedInstagramSource> {
    const dbSource = await this.prisma.instagramConnection.findUnique({
      where: {
        workspaceId,
      },
    });

    if (dbSource) {
      return {
        workspaceId,
        instagramUserId: dbSource.instagramUserId,
        username: dbSource.username ?? null,
        accessToken: await this.resolveStoredAccessToken(dbSource),
        source: 'database',
        warnings: [],
      };
    }

    if (!this.appConfigService.instagramEnvFallbackEnabled) {
      throw new InstagramSourceResolutionException(
        `Instagram source is not configured for workspace=${workspaceId}. Configure instagram_connections row for this workspace.`,
      );
    }

    const fallbackToken = this.appConfigService.instagramAccessToken;
    const fallbackUserId = this.appConfigService.instagramUserId;

    if (!fallbackToken || !fallbackUserId) {
      throw new InstagramSourceResolutionException(
        `No Instagram source available for workspace=${workspaceId}. Provide workspace-scoped connection or development fallback env values.`,
      );
    }

    this.logger.warn(
      `Using environment Instagram source fallback for workspace=${workspaceId}.`,
    );

    return {
      workspaceId,
      instagramUserId: fallbackUserId,
      username: null,
      accessToken: fallbackToken,
      source: 'environment',
      warnings: [
        'Using environment fallback for Instagram source. Configure workspace connection for production-like deployments.',
      ],
    };
  }

  private async resolveStoredAccessToken(input: {
    id: string;
    accessTokenEncrypted: string;
  }): Promise<string> {
    if (
      this.secretCryptoService.isEncryptedPayload(input.accessTokenEncrypted)
    ) {
      try {
        return this.secretCryptoService.decrypt(input.accessTokenEncrypted);
      } catch {
        throw new InstagramSourceResolutionException(
          `Failed to decrypt Instagram source token for connection=${input.id}.`,
        );
      }
    }

    const legacyToken = this.decodeLegacyStoredToken(
      input.accessTokenEncrypted,
    );
    if (!legacyToken || legacyToken.trim().length === 0) {
      throw new InstagramSourceResolutionException(
        `Instagram source token is empty for connection=${input.id}.`,
      );
    }

    try {
      const encrypted = this.secretCryptoService.encrypt(legacyToken);
      await this.prisma.instagramConnection.update({
        where: {
          id: input.id,
        },
        data: {
          accessTokenEncrypted: encrypted,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof CryptoOperationException &&
        error.code === CryptoErrorCode.ENCRYPTION_FAILED
      ) {
        throw new InstagramSourceResolutionException(
          `Failed to re-encrypt legacy Instagram source token for connection=${input.id}.`,
        );
      }

      throw error;
    }

    this.logger.warn(
      `Legacy Instagram token format auto-migrated to encrypted payload for connection=${input.id}.`,
    );
    return legacyToken;
  }

  private decodeLegacyStoredToken(value: string): string {
    if (value.startsWith('base64:')) {
      return Buffer.from(value.replace('base64:', ''), 'base64').toString(
        'utf8',
      );
    }

    return value;
  }
}
