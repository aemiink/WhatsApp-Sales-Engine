import {
  buildMetaSendTextRequest,
  MetaWhatsAppProvider,
} from './meta-whatsapp.provider';

describe('MetaWhatsAppProvider', () => {
  it('validates webhook challenge correctly', () => {
    const provider = new MetaWhatsAppProvider(
      {
        resolveConnection: jest.fn(),
      } as never,
      {
        whatsappProviderTimeoutMs: 12000,
      } as never,
    );

    expect(
      provider.verifyWebhook({
        mode: 'subscribe',
        verifyToken: 'token-1',
        expectedVerifyToken: 'token-1',
        challenge: '12345',
      }),
    ).toEqual({
      ok: true,
      challenge: '12345',
    });

    expect(
      provider.verifyWebhook({
        mode: 'subscribe',
        verifyToken: 'wrong',
        expectedVerifyToken: 'token-1',
        challenge: '12345',
      }),
    ).toEqual({
      ok: false,
      reason: 'verify token mismatch',
    });
  });

  it('builds correct outbound text message request payload', () => {
    const request = buildMetaSendTextRequest(
      {
        accessToken: 'access-token',
        phoneNumberId: '1234567890',
        webhookVerifyToken: 'verify-token',
        graphApiVersion: 'v21.0',
      },
      {
        to: '905551112233',
        text: 'Merhaba',
      },
    );

    expect(request.url).toBe(
      'https://graph.facebook.com/v21.0/1234567890/messages',
    );

    expect(request.payload).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '905551112233',
      type: 'text',
      text: {
        preview_url: false,
        body: 'Merhaba',
      },
    });

    expect(request.headers.Authorization).toBe('Bearer access-token');
  });
});
