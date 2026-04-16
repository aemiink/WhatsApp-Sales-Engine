import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { AnalyticsService } from '../../analytics/analytics.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessagesService } from '../../conversations/messages.service';
import { DEFAULT_WORKSPACE_ID } from '../../common/constants/workspace.constants';
import { AppConfigService } from '../../config/app-config.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SendTextWhatsAppMessageDto } from '../dto/send-text-whatsapp-message.dto';
import { maskPhoneNumber } from '../utils/phone-mask.util';
import { WHATSAPP_PROVIDER_TOKEN } from '../providers/whatsapp-provider.interface';
import type {
  SendTextMessageResult,
  WhatsAppProvider,
} from '../providers/whatsapp-provider.interface';
import { WhatsAppConnectionService } from './whatsapp-connection.service';

interface SendTextWithWorkspaceInput {
  workspaceId?: string;
  to: string;
  text: string;
}

@Injectable()
export class WhatsAppMessageSenderService {
  private readonly logger = new Logger(WhatsAppMessageSenderService.name);
  private readonly outboundThrottleMap = new Map<string, number>();

  constructor(
    @Inject(WHATSAPP_PROVIDER_TOKEN)
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly appConfigService: AppConfigService,
    private readonly whatsappConnectionService: WhatsAppConnectionService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendTextMessage(
    input: SendTextWhatsAppMessageDto,
  ): Promise<SendTextMessageResult> {
    const resolvedConnection =
      await this.whatsappConnectionService.resolveConnection(input.workspaceId);

    const workspaceId =
      input.workspaceId ??
      resolvedConnection.workspaceId ??
      DEFAULT_WORKSPACE_ID;

    this.logger.log(
      `Outbound WhatsApp send requested to=${maskPhoneNumber(input.to)} workspace=${workspaceId}`,
    );

    this.assertOutboundRateLimit(workspaceId, input.to);

    let response: SendTextMessageResult;
    try {
      response = await this.sendWithRetry({
        to: input.to,
        text: input.text,
        workspaceId,
      });
    } catch (error: unknown) {
      await this.analyticsService.safeTrack({
        workspaceId,
        type: 'message_send_failed',
        payloadJson: {
          to: maskPhoneNumber(input.to),
          errorMessage: this.toErrorMessage(error),
        },
      });

      await this.notificationsService.createAndDispatch({
        workspaceId,
        type: NotificationType.CONNECTION_ERROR,
        channel: NotificationChannel.BOTH,
        title: 'WhatsApp baglanti hatasi',
        message:
          'Mesaj iletimi basarisiz oldu. Baglantiyi test edip yeniden baglanmayi deneyin.',
        payload: {
          to: maskPhoneNumber(input.to),
          errorMessage: this.toErrorMessage(error),
        },
      });

      throw error;
    }

    const conversation = await this.conversationsService.findOrCreateByPhone(
      workspaceId,
      input.to,
    );

    const externalMessageId = response.messages[0]?.id;

    const persistedMessage = await this.messagesService.createOutboundMessage({
      conversationId: conversation.id,
      externalMessageId,
      content: input.text,
      rawPayload: response.rawResponse,
      timestamp: new Date(),
    });

    await this.analyticsService.safeTrack({
      workspaceId,
      conversationId: conversation.id,
      type: 'message_sent',
      payloadJson: {
        messageId: persistedMessage.id,
        externalMessageId: persistedMessage.externalMessageId,
        senderType: persistedMessage.senderType,
        direction: persistedMessage.direction,
      },
    });

    this.logger.log(
      `Outbound WhatsApp send succeeded to=${maskPhoneNumber(input.to)} idCount=${response.messages.length}`,
    );

    return response;
  }

  private async sendWithRetry(
    input: SendTextWithWorkspaceInput,
  ): Promise<SendTextMessageResult> {
    const maxAttempts = this.appConfigService.whatsappSendMaxRetries + 1;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.whatsappProvider.sendTextMessage({
          to: input.to,
          text: input.text,
          workspaceId: input.workspaceId,
        });
      } catch (error: unknown) {
        lastError = error;

        if (attempt >= maxAttempts) {
          break;
        }

        const delayMs =
          this.appConfigService.whatsappSendRetryBaseDelayMs *
          2 ** (attempt - 1);

        this.logger.warn(
          `Outbound WhatsApp retry scheduled to=${maskPhoneNumber(input.to)} attempt=${attempt + 1}/${maxAttempts} delayMs=${delayMs}`,
        );

        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }

  private assertOutboundRateLimit(workspaceId: string, to: string): void {
    const key = `${workspaceId}:${to}`;
    const now = Date.now();
    const minimumIntervalMs = this.appConfigService.outboundMinIntervalMs;
    const lastSentAt = this.outboundThrottleMap.get(key);

    if (lastSentAt && now - lastSentAt < minimumIntervalMs) {
      throw new HttpException(
        `Outbound rate limit exceeded for recipient ${maskPhoneNumber(to)}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.outboundThrottleMap.set(key, now);
  }

  private async sleep(delayMs: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return 'unknown_error';
  }
}
