import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AppConfigService } from '../../config/app-config.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessageStatusService } from '../../conversations/message-status.service';
import { MessagesService } from '../../conversations/messages.service';
import { DEFAULT_WORKSPACE_ID } from '../../common/constants/workspace.constants';
import { InboundEventQueueService } from '../../execution/services/inbound-event-queue.service';
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

interface IngestWebhookSecurityContext {
  signatureHeader?: string;
  rawBody?: Buffer;
}

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);
  private readonly inboundCounter = new Map<
    string,
    { count: number; windowStartMs: number }
  >();

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
    @Inject(forwardRef(() => InboundEventQueueService))
    private readonly inboundEventQueueService: InboundEventQueueService,
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

  async ingestWebhook(
    payload: unknown,
    securityContext?: IngestWebhookSecurityContext,
  ): Promise<{
    received: true;
    events: NormalizedInboundEventWithDedup[];
    eventCount: number;
    processedCount: number;
    duplicateCount: number;
    ignoredCount: number;
    errorCount: number;
  }> {
    this.assertWebhookSignature(payload, securityContext);

    const connection = await this.connectionService.resolveConnection();
    const workspaceId = connection.workspaceId ?? DEFAULT_WORKSPACE_ID;

    return this.processWebhookPayload(payload, workspaceId);
  }

  async testWebhookForWorkspace(
    workspaceId: string,
    payload: unknown,
  ): Promise<{
    received: true;
    events: NormalizedInboundEventWithDedup[];
    eventCount: number;
    processedCount: number;
    duplicateCount: number;
    ignoredCount: number;
    errorCount: number;
  }> {
    if (!this.appConfigService.webhookTestToolEnabled) {
      throw new ForbiddenException(
        'Webhook test tool is disabled for this environment.',
      );
    }

    await this.connectionService.resolveConnection(workspaceId);
    return this.processWebhookPayload(payload, workspaceId);
  }

  private async processWebhookPayload(
    payload: unknown,
    workspaceId: string,
  ): Promise<{
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

    this.logger.log(
      `Inbound webhook received workspaceId=${workspaceId} eventCount=${normalized.length}`,
    );

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
      if (
        normalizedEvent.eventType === 'message' &&
        !this.allowInboundEvent(
          workspaceId,
          normalizedEvent.fromPhoneNumber ?? 'unknown',
        )
      ) {
        summary.ignoredCount += 1;
        this.logger.warn(
          `Inbound rate limit exceeded workspaceId=${workspaceId} phone=${normalizedEvent.fromPhoneNumber ?? 'unknown'}`,
        );
        return;
      }

      const duplicate = await this.dedupService.isDuplicate(
        normalizedEvent,
        workspaceId,
      );
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

        await this.inboundEventQueueService.enqueue({
          workspaceId,
          conversationId: conversation.id,
          messageId: persistedMessage.id,
        });

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

  private allowInboundEvent(workspaceId: string, phoneNumber: string): boolean {
    const key = `${workspaceId}:${phoneNumber}`;
    const now = Date.now();
    const windowMs = this.appConfigService.inboundRateLimitWindowMs;
    const maxPerWindow = this.appConfigService.inboundRateLimitPerWindow;

    const current = this.inboundCounter.get(key);
    if (!current || now - current.windowStartMs >= windowMs) {
      this.inboundCounter.set(key, { count: 1, windowStartMs: now });
      return true;
    }

    if (current.count >= maxPerWindow) {
      return false;
    }

    current.count += 1;
    this.inboundCounter.set(key, current);
    return true;
  }

  private assertWebhookSignature(
    payload: unknown,
    securityContext?: IngestWebhookSecurityContext,
  ): void {
    if (!this.appConfigService.whatsappWebhookSignatureRequired) {
      return;
    }

    const appSecret = this.appConfigService.whatsappAppSecret;
    if (!appSecret) {
      throw new MissingWhatsAppConfigException(
        'WHATSAPP_APP_SECRET is required when webhook signature check is enabled.',
      );
    }

    const providedSignature = this.parseSignatureHeader(
      securityContext?.signatureHeader,
    );
    if (!providedSignature) {
      throw new InvalidWebhookChallengeException(
        'Missing or invalid x-hub-signature-256 header.',
      );
    }

    const bodyBuffer =
      securityContext?.rawBody ?? this.toRawBodyBuffer(payload);
    const expectedSignature = createHmac('sha256', appSecret)
      .update(bodyBuffer)
      .digest('hex');

    if (!this.constantTimeHexCompare(expectedSignature, providedSignature)) {
      throw new InvalidWebhookChallengeException(
        'Webhook signature validation failed.',
      );
    }
  }

  private parseSignatureHeader(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const [algorithm, signature] = value.split('=');
    if (algorithm !== 'sha256' || !signature) {
      return null;
    }

    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      return null;
    }

    return signature.toLowerCase();
  }

  private constantTimeHexCompare(
    expectedHex: string,
    receivedHex: string,
  ): boolean {
    const expected = Buffer.from(expectedHex, 'hex');
    const received = Buffer.from(receivedHex, 'hex');

    if (expected.length !== received.length) {
      return false;
    }

    return timingSafeEqual(expected, received);
  }

  private toRawBodyBuffer(payload: unknown): Buffer {
    return Buffer.from(JSON.stringify(payload));
  }
}
