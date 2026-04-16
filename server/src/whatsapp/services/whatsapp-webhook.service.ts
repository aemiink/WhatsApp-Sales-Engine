import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  NormalizedInboundEventWithDedup,
  NormalizedWhatsAppEvent,
} from '../dto/normalized-whatsapp-event.dto';
import { WhatsAppWebhookVerificationQueryDto } from '../dto/webhook-verification-query.dto';
import {
  InvalidInboundPayloadException,
  InvalidWebhookChallengeException,
  MissingWhatsAppConfigException,
} from '../errors/whatsapp.errors';
import { WHATSAPP_PROVIDER_TOKEN } from '../providers/whatsapp-provider.interface';
import type { WhatsAppProvider } from '../providers/whatsapp-provider.interface';
import { WhatsAppDedupService } from './whatsapp-dedup.service';
import { WhatsAppMessageParserService } from './whatsapp-message-parser.service';
import { Inject } from '@nestjs/common';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

  ingestWebhook(payload: unknown): {
    received: true;
    events: NormalizedInboundEventWithDedup[];
    eventCount: number;
  } {
    if (!isRecord(payload) || payload.object !== 'whatsapp_business_account') {
      throw new InvalidInboundPayloadException(
        'Invalid WhatsApp webhook payload. Expected object=whatsapp_business_account.',
      );
    }

    const events = this.parserService.parseWebhookPayload(payload);
    const normalized = events.map((event) => this.attachDedupKey(event));

    this.logger.log(`Inbound webhook received eventCount=${normalized.length}`);

    const unknownCount = normalized.filter(
      (event) => event.normalizedEvent.eventType === 'unknown',
    ).length;

    if (unknownCount > 0) {
      this.logger.warn(
        `Inbound webhook contained ${unknownCount} unknown event(s).`,
      );
    }

    return {
      received: true,
      events: normalized,
      eventCount: normalized.length,
    };
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
