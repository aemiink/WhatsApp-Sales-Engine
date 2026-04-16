export type NormalizedWhatsAppEventType = 'message' | 'status' | 'unknown';

export interface NormalizedWhatsAppEvent {
  eventType: NormalizedWhatsAppEventType;
  externalMessageId: string | null;
  fromPhoneNumber: string | null;
  timestamp: string | null;
  messageType: string | null;
  textBody: string | null;
  status: string | null;
  contactProfileName: string | null;
  rawPayload: unknown;
}

export interface NormalizedInboundEventWithDedup {
  dedupKey: string;
  normalizedEvent: NormalizedWhatsAppEvent;
}
