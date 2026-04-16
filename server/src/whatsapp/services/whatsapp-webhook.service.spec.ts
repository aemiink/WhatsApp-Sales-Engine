import { AppConfigService } from '../../config/app-config.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessageStatusService } from '../../conversations/message-status.service';
import { MessagesService } from '../../conversations/messages.service';
import { InvalidWebhookChallengeException } from '../errors/whatsapp.errors';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { WhatsAppDedupService } from './whatsapp-dedup.service';
import { WhatsAppMessageParserService } from './whatsapp-message-parser.service';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

describe('WhatsAppWebhookService', () => {
  const parser = new WhatsAppMessageParserService();

  const connectionServiceMock = {
    resolveConnection: jest.fn().mockResolvedValue({
      workspaceId: 'default-workspace',
    }),
  } as unknown as WhatsAppConnectionService;

  const conversationsServiceMock = {
    findOrCreateByPhone: jest.fn().mockResolvedValue({ id: 'conv-1' }),
  } as unknown as ConversationsService;

  const messagesServiceMock = {
    createInboundMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
  } as unknown as MessagesService;

  const messageStatusServiceMock = {
    updateStatusFromEvent: jest.fn().mockResolvedValue(true),
  } as unknown as MessageStatusService;

  it('returns challenge when provider verifies successfully', () => {
    const service = new WhatsAppWebhookService(
      {
        verifyWebhook: jest
          .fn()
          .mockReturnValue({ ok: true, challenge: 'abc' }),
        sendTextMessage: jest.fn(),
      },
      parser,
      {
        createInboundDedupKey: jest.fn().mockReturnValue('dedup-1'),
        isDuplicate: jest.fn().mockResolvedValue(false),
      } as unknown as WhatsAppDedupService,
      {
        whatsappWebhookVerifyToken: 'verify-token',
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
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
      {
        createInboundDedupKey: jest.fn().mockReturnValue('dedup-1'),
        isDuplicate: jest.fn().mockResolvedValue(false),
      } as unknown as WhatsAppDedupService,
      {
        whatsappWebhookVerifyToken: 'verify-token',
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
    );

    expect(() =>
      service.verifyWebhook({
        hubMode: 'subscribe',
        hubVerifyToken: 'wrong',
        hubChallenge: 'abc',
      }),
    ).toThrow(InvalidWebhookChallengeException);
  });

  it('ignores duplicate inbound events', async () => {
    const dedupMock = {
      createInboundDedupKey: jest.fn().mockReturnValue('dedup-1'),
      isDuplicate: jest.fn().mockResolvedValue(true),
    } as unknown as WhatsAppDedupService;

    const service = new WhatsAppWebhookService(
      {
        verifyWebhook: jest.fn(),
        sendTextMessage: jest.fn(),
      },
      parser,
      dedupMock,
      {
        whatsappWebhookVerifyToken: 'verify-token',
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
    );

    const response = await service.ingestWebhook({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
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
    });

    expect(response.duplicateCount).toBe(1);
  });
});
