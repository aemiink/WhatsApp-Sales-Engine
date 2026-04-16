import { Injectable, Logger } from '@nestjs/common';
import { NormalizedWhatsAppEvent } from '../dto/normalized-whatsapp-event.dto';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class WhatsAppMessageParserService {
  private readonly logger = new Logger(WhatsAppMessageParserService.name);

  parseWebhookPayload(payload: unknown): NormalizedWhatsAppEvent[] {
    const events: NormalizedWhatsAppEvent[] = [];

    if (!isRecord(payload)) {
      return [this.createUnknownEvent(payload)];
    }

    const entryList = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entryList) {
      if (!isRecord(entry)) {
        continue;
      }

      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        if (!isRecord(change)) {
          continue;
        }

        const value = isRecord(change.value) ? change.value : {};

        const contacts = this.extractContacts(value.contacts);
        const messages = Array.isArray(value.messages) ? value.messages : [];
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];

        for (const message of messages) {
          events.push(this.parseMessageEvent(message, contacts, change));
        }

        for (const status of statuses) {
          events.push(this.parseStatusEvent(status, contacts, change));
        }

        if (messages.length === 0 && statuses.length === 0) {
          this.logger.warn(
            'Received webhook change without message/status payload.',
          );
          events.push(this.createUnknownEvent(change));
        }
      }
    }

    if (events.length === 0) {
      events.push(this.createUnknownEvent(payload));
    }

    return events;
  }

  private parseMessageEvent(
    message: unknown,
    contacts: Map<string, string>,
    fallbackPayload: unknown,
  ): NormalizedWhatsAppEvent {
    if (!isRecord(message)) {
      return this.createUnknownEvent(fallbackPayload);
    }

    const fromPhoneNumber = this.stringOrNull(message.from);
    const messageType = this.stringOrNull(message.type);

    let textBody: string | null = null;
    if (messageType === 'text' && isRecord(message.text)) {
      textBody = this.stringOrNull(message.text.body);
    }

    return {
      eventType: 'message',
      externalMessageId: this.stringOrNull(message.id),
      fromPhoneNumber,
      timestamp: this.stringOrNull(message.timestamp),
      messageType,
      textBody,
      status: null,
      contactProfileName: fromPhoneNumber
        ? (contacts.get(fromPhoneNumber) ?? null)
        : null,
      rawPayload: message,
    };
  }

  private parseStatusEvent(
    status: unknown,
    contacts: Map<string, string>,
    fallbackPayload: unknown,
  ): NormalizedWhatsAppEvent {
    if (!isRecord(status)) {
      return this.createUnknownEvent(fallbackPayload);
    }

    const recipient = this.stringOrNull(status.recipient_id);

    return {
      eventType: 'status',
      externalMessageId: this.stringOrNull(status.id),
      fromPhoneNumber: recipient,
      timestamp: this.stringOrNull(status.timestamp),
      messageType: this.stringOrNull(status.type),
      textBody: null,
      status: this.stringOrNull(status.status),
      contactProfileName: recipient ? (contacts.get(recipient) ?? null) : null,
      rawPayload: status,
    };
  }

  private extractContacts(value: unknown): Map<string, string> {
    const map = new Map<string, string>();

    const contacts = Array.isArray(value) ? value : [];

    for (const contact of contacts) {
      if (!isRecord(contact)) {
        continue;
      }

      const waId = this.stringOrNull(contact.wa_id);
      const profile = isRecord(contact.profile) ? contact.profile : undefined;
      const name = profile ? this.stringOrNull(profile.name) : null;

      if (waId && name) {
        map.set(waId, name);
      }
    }

    return map;
  }

  private createUnknownEvent(rawPayload: unknown): NormalizedWhatsAppEvent {
    return {
      eventType: 'unknown',
      externalMessageId: null,
      fromPhoneNumber: null,
      timestamp: null,
      messageType: null,
      textBody: null,
      status: null,
      contactProfileName: null,
      rawPayload,
    };
  }

  private stringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}
