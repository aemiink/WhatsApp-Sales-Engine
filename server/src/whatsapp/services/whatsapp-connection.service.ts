import { Injectable, Logger } from '@nestjs/common';
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
