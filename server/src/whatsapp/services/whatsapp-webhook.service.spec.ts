import { AppConfigService } from '../../config/app-config.service';
import { InvalidWebhookChallengeException } from '../errors/whatsapp.errors';
import { WhatsAppDedupService } from './whatsapp-dedup.service';
import { WhatsAppMessageParserService } from './whatsapp-message-parser.service';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

describe('WhatsAppWebhookService', () => {
  const parser = new WhatsAppMessageParserService();
  const dedup = new WhatsAppDedupService();

  it('returns challenge when provider verifies successfully', () => {
    const service = new WhatsAppWebhookService(
      {
        verifyWebhook: jest
          .fn()
          .mockReturnValue({ ok: true, challenge: 'abc' }),
        sendTextMessage: jest.fn(),
      },
      parser,
      dedup,
      {
        whatsappWebhookVerifyToken: 'verify-token',
      } as AppConfigService,
    );

    const challenge = service.verifyWebhook({
      hubMode: 'subscribe',
      hubVerifyToken: 'verify-token',
      hubChallenge: 'abc',
    });

    expect(challenge).toBe('abc');
  });

  it('throws typed exception when webhook verification fails', () => {
    const service = new WhatsAppWebhookService(
      {
        verifyWebhook: jest
          .fn()
          .mockReturnValue({ ok: false, reason: 'mismatch' }),
        sendTextMessage: jest.fn(),
      },
      parser,
      dedup,
      {
        whatsappWebhookVerifyToken: 'verify-token',
      } as AppConfigService,
    );

    expect(() =>
      service.verifyWebhook({
        hubMode: 'subscribe',
        hubVerifyToken: 'wrong',
        hubChallenge: 'abc',
      }),
    ).toThrow(InvalidWebhookChallengeException);
  });
});
