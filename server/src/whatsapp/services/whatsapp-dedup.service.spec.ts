import { WhatsAppDedupService } from './whatsapp-dedup.service';

describe('WhatsAppDedupService', () => {
  const service = new WhatsAppDedupService();

  it('uses external message id when available', () => {
    const key = service.createInboundDedupKey({
      eventType: 'message',
      externalMessageId: 'wamid.HBgM...',
      fromPhoneNumber: '905551112233',
      timestamp: '1710000000',
      messageType: 'text',
      textBody: 'Merhaba',
      status: null,
      contactProfileName: null,
      rawPayload: {},
    });

    expect(key).toBe('wamid:wamid.HBgM...');
  });

  it('creates deterministic fallback hash when id is missing', () => {
    const event = {
      eventType: 'status' as const,
      externalMessageId: null,
      fromPhoneNumber: '905551112233',
      timestamp: '1710000000',
      messageType: null,
      textBody: null,
      status: 'delivered',
      contactProfileName: null,
      rawPayload: {},
    };

    const first = service.createInboundDedupKey(event);
    const second = service.createInboundDedupKey(event);

    expect(first).toEqual(second);
    expect(first.startsWith('fallback:')).toBe(true);
  });
});
