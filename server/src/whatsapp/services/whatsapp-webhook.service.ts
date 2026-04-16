import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AppConfigService } from '../../config/app-config.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessageStatusService } from '../../conversations/message-status.service';
import { MessagesService } from '../../conversations/messages.service';
import { DEFAULT_WORKSPACE_ID } from '../../common/constants/workspace.constants';
import { ExecutionService } from '../../execution/services/execution.service';
import {
  NormalizedInboundEventWithDedup,
  NormalizedWhatsAppEvent,
} from '../dto/normalized-whatsapp-event.dto';
import { WhatsAppWebhookVerificationQueryDto } from '../dto/webhook-verification-query.dto';
import {
  InvalidWebhookChallengeException,
  MissingWhatsAppConfigException,
} from '../errors/whatsapp.errors';
import { WHATSAPP_PROVIDER_TOKEN } from '../providers/whatsapp-provider.interface';
import type { WhatsAppProvider } from '../providers/whatsapp-provider.interface';
import { WhatsAppDedupService } from './whatsapp-dedup.service';
import { WhatsAppMessageParserService } from './whatsapp-message-parser.service';
import { WhatsAppConnectionService } from './whatsapp-connection.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUniqueConstraintError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return true;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

interface WebhookProcessSummary {
  processedCount: number;
  duplicateCount: number;
  ignoredCount: number;
  errorCount: number;
}

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    @Inject(WHATSAPP_PROVIDER_TOKEN)
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly parserService: WhatsAppMessageParserService,
    private readonly dedupService: WhatsAppDedupService,
    private readonly appConfigService: AppConfigService,
    private readonly connectionService: WhatsAppConnectionService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly messageStatusService: MessageStatusService,
    private readonly analyticsService: AnalyticsService,
    @Inject(forwardRef(() => ExecutionService))
    private readonly executionService: ExecutionService,
  ) {}

  verifyWebhook(query: WhatsAppWebhookVerificationQueryDto): string {
    const expectedVerifyToken =
      this.appConfigService.whatsappWebhookVerifyToken;

    if (!expectedVerifyToken) {
      throw new MissingWhatsAppConfigException(
        'Missing WHATSAPP_WEBHOOK_VERIFY_TOKEN configuration.',
      );
    }

    this.logger.log(
      `Webhook verification request received mode=${query.hubMode ?? 'missing'}`,
    );

    const verification = this.whatsappProvider.verifyWebhook({
      mode: query.hubMode,
      verifyToken: query.hubVerifyToken,
      challenge: query.hubChallenge,
      expectedVerifyToken,
    });

    if (!verification.ok || !verification.challenge) {
      this.logger.warn(
        `Webhook verification failed reason=${verification.reason ?? 'unknown'}`,
      );
      throw new InvalidWebhookChallengeException(
        'Webhook verification failed.',
        verification,
      );
    }

    this.logger.log('Webhook verification succeeded.');
    return verification.challenge;
  }

  async ingestWebhook(payload: unknown): Promise<{
    received: true;
    events: NormalizedInboundEventWithDedup[];
    eventCount: number;
    processedCount: number;
    duplicateCount: number;
    ignoredCount: number;
    errorCount: number;
  }> {
    if (!isRecord(payload) || payload.object !== 'whatsapp_business_account') {
      this.logger.warn(
        'Inbound webhook ignored due to invalid payload shape (object mismatch).',
      );

      return {
        received: true,
        events: [],
        eventCount: 0,
        processedCount: 0,
        duplicateCount: 0,
        ignoredCount: 1,
        errorCount: 1,
      };
    }

    const events = this.parserService.parseWebhookPayload(payload);
    const normalized = events.map((event) => this.attachDedupKey(event));

    this.logger.log(`Inbound webhook received eventCount=${normalized.length}`);

    const connection = await this.connectionService.resolveConnection();
    const workspaceId = connection.workspaceId ?? DEFAULT_WORKSPACE_ID;

    const summary: WebhookProcessSummary = {
      processedCount: 0,
      duplicateCount: 0,
      ignoredCount: 0,
      errorCount: 0,
    };

    for (const event of normalized) {
      await this.processSingleEvent(workspaceId, event, summary);
    }

    return {
      received: true,
      events: normalized,
      eventCount: normalized.length,
      ...summary,
    };
  }

  private async processSingleEvent(
    workspaceId: string,
    event: NormalizedInboundEventWithDedup,
    summary: WebhookProcessSummary,
  ): Promise<void> {
    const normalizedEvent = event.normalizedEvent;

    try {
      const duplicate = await this.dedupService.isDuplicate(normalizedEvent);
      if (duplicate) {
        summary.duplicateCount += 1;
        this.logger.warn(
          `Duplicate webhook event detected dedupKey=${event.dedupKey}`,
        );
        return;
      }

      if (normalizedEvent.eventType === 'message') {
        if (!normalizedEvent.fromPhoneNumber) {
          summary.errorCount += 1;
          this.logger.warn(
            'Inbound message ignored because fromPhoneNumber is missing.',
          );
          return;
        }

        const conversation =
          await this.conversationsService.findOrCreateByPhone(
            workspaceId,
            normalizedEvent.fromPhoneNumber,
          );

        const persistedMessage =
          await this.messagesService.createInboundMessage({
            conversationId: conversation.id,
            event: normalizedEvent,
          });

        await this.analyticsService.safeTrack({
          workspaceId,
          conversationId: conversation.id,
          type: 'message_received',
          payloadJson: {
            messageId: persistedMessage.id,
            externalMessageId: persistedMessage.externalMessageId,
            messageType: persistedMessage.messageType,
          },
        });

        try {
          await this.executionService.executeForInboundMessage(
            conversation.id,
            persistedMessage.id,
          );
        } catch (error: unknown) {
          this.logger.error(
            `Execution flow failed for conversationId=${conversation.id} messageId=${persistedMessage.id}`,
            error as Error,
          );
        }

        summary.processedCount += 1;
        return;
      }

      if (normalizedEvent.eventType === 'status') {
        const updated =
          await this.messageStatusService.updateStatusFromEvent(
            normalizedEvent,
          );

        if (updated) {
          summary.processedCount += 1;
        } else {
          summary.ignoredCount += 1;
        }

        return;
      }

      summary.ignoredCount += 1;
      this.logger.warn(
        'Inbound webhook event ignored because eventType is unknown.',
      );
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        summary.duplicateCount += 1;
        this.logger.warn(
          `Duplicate blocked by unique constraint dedupKey=${event.dedupKey}`,
        );
        return;
      }

      summary.errorCount += 1;
      this.logger.error(
        'Failed to process inbound webhook event',
        error as Error,
      );
    }
  }

  private attachDedupKey(
    normalizedEvent: NormalizedWhatsAppEvent,
  ): NormalizedInboundEventWithDedup {
    return {
      normalizedEvent,
      dedupKey: this.dedupService.createInboundDedupKey(normalizedEvent),
    };
  }
}
