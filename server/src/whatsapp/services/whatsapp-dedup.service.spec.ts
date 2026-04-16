import { WhatsAppDedupService } from './whatsapp-dedup.service';

describe('WhatsAppDedupService', () => {
  it('uses message table for external inbound message id duplicate check', async () => {
    const prismaMock = {
      message: {
        findUnique: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      },
      inboundEventLog: {
        create: jest.fn(),
      },
    };

    const service = new WhatsAppDedupService(prismaMock as never);

    const isDuplicate = await service.isDuplicate({
      eventType: 'message',
      externalMessageId: 'wamid.1',
      fromPhoneNumber: '905551112233',
      timestamp: '1710000000',
      messageType: 'text',
      textBody: 'Merhaba',
      status: null,
      contactProfileName: null,
      rawPayload: {},
    });

    expect(isDuplicate).toBe(true);
    expect(prismaMock.inboundEventLog.create).not.toHaveBeenCalled();
  });

  it('stores fallback dedup key and marks duplicate on unique conflict', async () => {
    const prismaMock = {
      message: {
        findUnique: jest.fn(),
      },
      inboundEventLog: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 'log-1' })
          .mockRejectedValueOnce({ code: 'P2002' }),
      },
    };

    const service = new WhatsAppDedupService(prismaMock as never);

    const event = {
      eventType: 'unknown' as const,
      externalMessageId: null,
      fromPhoneNumber: '905551112233',
      timestamp: '1710000000',
      messageType: null,
      textBody: null,
      status: null,
      contactProfileName: null,
      rawPayload: {},
    };

    const first = await service.isDuplicate(event);
    const second = await service.isDuplicate(event);

    expect(first).toBe(false);
    expect(second).toBe(true);
  });

  it('generates deterministic dedup key', () => {
    const service = new WhatsAppDedupService({} as never);

    const event = {
      eventType: 'status' as const,
      externalMessageId: 'wamid.1',
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

    expect(first).toBe(second);
    expect(first).toBe('status:wamid.1:delivered:1710000000');
  });
});
