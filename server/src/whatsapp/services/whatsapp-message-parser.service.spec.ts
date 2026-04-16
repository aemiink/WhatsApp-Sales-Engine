import { WhatsAppMessageParserService } from './whatsapp-message-parser.service';

describe('WhatsAppMessageParserService', () => {
  const service = new WhatsAppMessageParserService();

  it('parses inbound text messages into normalized events', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [
                  {
                    wa_id: '905551112233',
                    profile: { name: 'Ahmet' },
                  },
                ],
                messages: [
                  {
                    id: 'wamid.1',
                    from: '905551112233',
                    timestamp: '1710000000',
                    type: 'text',
                    text: {
                      body: 'Merhaba',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const events = service.parseWebhookPayload(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventType: 'message',
      externalMessageId: 'wamid.1',
      fromPhoneNumber: '905551112233',
      messageType: 'text',
      textBody: 'Merhaba',
      contactProfileName: 'Ahmet',
    });
  });

  it('parses status events into normalized events', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: 'wamid.1',
                    status: 'delivered',
                    recipient_id: '905551112233',
                    timestamp: '1710000001',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const events = service.parseWebhookPayload(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventType: 'status',
      externalMessageId: 'wamid.1',
      fromPhoneNumber: '905551112233',
      status: 'delivered',
      textBody: null,
    });
  });
});
