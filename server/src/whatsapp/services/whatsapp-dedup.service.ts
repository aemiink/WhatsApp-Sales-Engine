import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { NormalizedWhatsAppEvent } from '../dto/normalized-whatsapp-event.dto';

@Injectable()
export class WhatsAppDedupService {
  createInboundDedupKey(event: NormalizedWhatsAppEvent): string {
    if (event.externalMessageId) {
      return `wamid:${event.externalMessageId}`;
    }

    const fallbackRaw = [
      event.eventType,
      event.fromPhoneNumber ?? 'unknown',
      event.timestamp ?? 'unknown',
      event.messageType ?? 'unknown',
      event.status ?? 'unknown',
      event.textBody ?? 'unknown',
    ].join('|');

    const hash = createHash('sha256').update(fallbackRaw).digest('hex');
    return `fallback:${hash}`;
  }
}
