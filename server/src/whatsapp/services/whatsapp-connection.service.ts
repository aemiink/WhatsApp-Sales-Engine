import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../database/prisma.service';
import {
  MissingWhatsAppConfigException,
  WhatsAppConnectionResolutionException,
} from '../errors/whatsapp.errors';

export interface ResolvedWhatsAppConnection {
  workspaceId?: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  webhookVerifyToken: string;
  graphApiVersion: string;
}

export type WhatsAppConnectionSource = 'database' | 'environment' | 'none';

export interface WhatsAppConnectionSnapshot {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string | null;
  hasAccessToken: boolean;
  source: 'database' | 'environment';
  lastUpdatedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface WhatsAppConnectionHealth {
  status: 'healthy' | 'degraded' | 'disconnected';
  checkedAt: string;
  message: string;
}

export interface WhatsAppConnectionStatus {
  connected: boolean;
  source: WhatsAppConnectionSource;
  connection: WhatsAppConnectionSnapshot | null;
  health: WhatsAppConnectionHealth;
}

export interface WhatsAppConnectionActionResult {
  ok: boolean;
  message: string;
  checkedAt: string;
  status: WhatsAppConnectionStatus;
}

@Injectable()
export class WhatsAppConnectionService {
  private readonly logger = new Logger(WhatsAppConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async resolveConnection(
    workspaceId?: string,
  ): Promise<ResolvedWhatsAppConnection> {
    const fromEnv = this.resolveFromEnvironment();
    const fromDb = await this.resolveFromDatabase(workspaceId);

    const resolved: ResolvedWhatsAppConnection = {
      workspaceId: fromDb?.workspaceId ?? workspaceId,
      accessToken: fromDb?.accessToken ?? fromEnv.accessToken,
      phoneNumberId: fromDb?.phoneNumberId ?? fromEnv.phoneNumberId,
      businessAccountId: fromDb?.businessAccountId ?? fromEnv.businessAccountId,
      webhookVerifyToken:
        fromDb?.webhookVerifyToken ?? fromEnv.webhookVerifyToken,
      graphApiVersion: fromEnv.graphApiVersion,
    };

    if (!resolved.accessToken || !resolved.phoneNumberId) {
      throw new MissingWhatsAppConfigException(
        'Missing WhatsApp outbound config. Ensure access token and phone number ID are configured.',
      );
    }

    if (!resolved.webhookVerifyToken) {
      throw new MissingWhatsAppConfigException(
        'Missing WhatsApp webhook verify token. Set WHATSAPP_WEBHOOK_VERIFY_TOKEN.',
      );
    }

    return resolved;
  }

  async getConnectionStatus(
    workspaceId: string,
  ): Promise<WhatsAppConnectionStatus> {
    const checkedAt = new Date().toISOString();

    const dbConnection = await this.prisma.whatsAppConnection.findUnique({
      where: {
        workspaceId,
      },
    });

    let resolved: ResolvedWhatsAppConnection | null = null;
    try {
      resolved = await this.resolveConnection(workspaceId);
    } catch (error: unknown) {
      this.logger.warn(
        `Connection resolve failed workspace=${workspaceId} reason=${this.toErrorMessage(error)}`,
      );
    }

    if (!resolved) {
      return {
        connected: false,
        source: 'none',
        connection: null,
        health: {
          status: 'disconnected',
          checkedAt,
          message: 'No WhatsApp connection configuration found.',
        },
      };
    }

    const source: WhatsAppConnectionSource = dbConnection
      ? 'database'
      : 'environment';
    const snapshot = dbConnection
      ? this.snapshotFromDatabase(dbConnection)
      : this.snapshotFromEnvironment(workspaceId, resolved);

    const probe = await this.probeMetaConnection(resolved);

    return {
      connected: true,
      source,
      connection: snapshot,
      health: {
        status: probe.ok ? 'healthy' : 'degraded',
        checkedAt,
        message: probe.message,
      },
    };
  }

  async testConnection(
    workspaceId: string,
  ): Promise<WhatsAppConnectionActionResult> {
    const status = await this.getConnectionStatus(workspaceId);
    const checkedAt = status.health.checkedAt;

    await this.updateWorkspaceMetadata(workspaceId, {
      lastTestAt: checkedAt,
      lastTestStatus: status.health.status,
      lastTestMessage: status.health.message,
    });

    const ok = status.connected && status.health.status === 'healthy';
    return {
      ok,
      message: ok
        ? 'Connection test succeeded.'
        : `Connection test failed: ${status.health.message}`,
      checkedAt,
      status,
    };
  }

  async reconnectConnection(
    workspaceId: string,
  ): Promise<WhatsAppConnectionActionResult> {
    const status = await this.getConnectionStatus(workspaceId);
    const checkedAt = status.health.checkedAt;

    await this.updateWorkspaceMetadata(workspaceId, {
      lastReconnectAt: checkedAt,
      lastReconnectStatus: status.health.status,
      lastReconnectMessage: status.health.message,
    });

    const ok = status.connected && status.health.status === 'healthy';

    return {
      ok,
      message: ok
        ? 'Reconnect validation succeeded.'
        : `Reconnect validation failed: ${status.health.message}`,
      checkedAt,
      status,
    };
  }

  async removeWorkspaceConnection(
    workspaceId: string,
  ): Promise<WhatsAppConnectionActionResult> {
    const deleted = await this.prisma.whatsAppConnection.deleteMany({
      where: {
        workspaceId,
      },
    });

    const status = await this.getConnectionStatus(workspaceId);
    const checkedAt = status.health.checkedAt;

    return {
      ok: deleted.count > 0,
      message:
        deleted.count > 0
          ? 'Workspace connection removed.'
          : 'Workspace connection record not found.',
      checkedAt,
      status,
    };
  }

  private resolveFromEnvironment(): Omit<
    ResolvedWhatsAppConnection,
    'workspaceId'
  > {
    return {
      accessToken: this.appConfigService.whatsappAccessToken,
      phoneNumberId: this.appConfigService.whatsappPhoneNumberId,
      businessAccountId: this.appConfigService.whatsappBusinessAccountId,
      webhookVerifyToken: this.appConfigService.whatsappWebhookVerifyToken,
      graphApiVersion: this.appConfigService.metaGraphApiVersion,
    };
  }

  private async resolveFromDatabase(workspaceId?: string): Promise<
    | {
        workspaceId: string;
        accessToken: string;
        phoneNumberId: string;
        businessAccountId?: string;
        webhookVerifyToken?: string;
      }
    | undefined
  > {
    try {
      const connection = workspaceId
        ? await this.prisma.whatsAppConnection.findUnique({
            where: {
              workspaceId,
            },
          })
        : await this.prisma.whatsAppConnection.findFirst({
            orderBy: {
              createdAt: 'desc',
            },
          });

      if (!connection) {
        return undefined;
      }

      return {
        workspaceId: connection.workspaceId,
        accessToken: this.decryptAccessToken(connection.accessTokenEncrypted),
        phoneNumberId: connection.phoneNumberId,
        businessAccountId: connection.businessAccountId ?? undefined,
        webhookVerifyToken: connection.webhookVerifyToken ?? undefined,
      };
    } catch (error: unknown) {
      this.logger.warn(
        'Failed to resolve WhatsApp connection from database. Falling back to env config.',
      );

      if (workspaceId) {
        throw new WhatsAppConnectionResolutionException(
          `Failed to resolve WhatsApp connection for workspace: ${workspaceId}`,
          error,
        );
      }

      return undefined;
    }
  }

  private snapshotFromDatabase(connection: {
    id: string;
    workspaceId: string;
    phoneNumber: string;
    phoneNumberId: string;
    businessAccountId: string | null;
    accessTokenEncrypted: string;
    updatedAt: Date;
    metadataJson: unknown;
  }): WhatsAppConnectionSnapshot {
    return {
      id: connection.id,
      workspaceId: connection.workspaceId,
      phoneNumber: connection.phoneNumber,
      phoneNumberId: connection.phoneNumberId,
      businessAccountId: connection.businessAccountId,
      hasAccessToken: connection.accessTokenEncrypted.length > 0,
      source: 'database',
      lastUpdatedAt: connection.updatedAt.toISOString(),
      metadata: this.toMetadataObject(connection.metadataJson),
    };
  }

  private snapshotFromEnvironment(
    workspaceId: string,
    connection: ResolvedWhatsAppConnection,
  ): WhatsAppConnectionSnapshot {
    return {
      id: `env-${workspaceId}`,
      workspaceId,
      phoneNumber: 'configured-via-env',
      phoneNumberId: connection.phoneNumberId,
      businessAccountId: connection.businessAccountId ?? null,
      hasAccessToken: connection.accessToken.length > 0,
      source: 'environment',
      lastUpdatedAt: null,
      metadata: null,
    };
  }

  private async probeMetaConnection(
    connection: ResolvedWhatsAppConnection,
  ): Promise<{ ok: boolean; message: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.appConfigService.whatsappProviderTimeoutMs,
    );

    try {
      const url = `https://graph.facebook.com/${connection.graphApiVersion}/${connection.phoneNumberId}?fields=id,display_phone_number`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        signal: controller.signal,
      });

      const body = await this.parseResponseBody(response);
      if (!response.ok) {
        return {
          ok: false,
          message: `Meta Graph probe failed (${response.status}): ${this.toErrorMessage(body)}`,
        };
      }

      return {
        ok: true,
        message: 'Connection is healthy.',
      };
    } catch (error: unknown) {
      return {
        ok: false,
        message: `Connection probe error: ${this.toErrorMessage(error)}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async updateWorkspaceMetadata(
    workspaceId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const existing = await this.prisma.whatsAppConnection.findUnique({
      where: {
        workspaceId,
      },
      select: {
        metadataJson: true,
      },
    });

    if (!existing) {
      return;
    }

    const merged = {
      ...this.toMetadataObject(existing.metadataJson),
      ...patch,
    };

    await this.prisma.whatsAppConnection.update({
      where: {
        workspaceId,
      },
      data: {
        metadataJson: merged as Prisma.InputJsonValue,
      },
    });
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return text.length > 0 ? text : null;
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  }

  private toMetadataObject(value: unknown): Record<string, unknown> | null {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return null;
  }

  private toErrorMessage(value: unknown): string {
    if (value instanceof Error && value.message.length > 0) {
      return value.message;
    }

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      if ('message' in value) {
        const message = (value as { message?: unknown }).message;
        if (typeof message === 'string' && message.length > 0) {
          return message;
        }
      }

      return JSON.stringify(value);
    }

    return 'unknown_error';
  }

  private decryptAccessToken(accessTokenEncrypted: string): string {
    if (accessTokenEncrypted.startsWith('base64:')) {
      return Buffer.from(
        accessTokenEncrypted.replace('base64:', ''),
        'base64',
      ).toString('utf8');
    }

    return accessTokenEncrypted;
  }
}
