import { createHmac } from 'crypto';
import { AppConfigService } from '../../config/app-config.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessageStatusService } from '../../conversations/message-status.service';
import { MessagesService } from '../../conversations/messages.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { InboundEventQueueService } from '../../execution/services/inbound-event-queue.service';
import { InvalidWebhookChallengeException } from '../errors/whatsapp.errors';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { WhatsAppDedupService } from './whatsapp-dedup.service';
import { WhatsAppMessageParserService } from './whatsapp-message-parser.service';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

describe('WhatsAppWebhookService', () => {
  const parser = new WhatsAppMessageParserService();
  const appSecret = 'test-whatsapp-app-secret-value';

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

  const inboundQueueServiceMock = {
    enqueue: jest.fn().mockResolvedValue({
      queued: true,
      jobId: 'conv-1:msg-1',
    }),
  } as unknown as InboundEventQueueService;

  const analyticsServiceMock = {
    safeTrack: jest.fn().mockResolvedValue(undefined),
  } as unknown as AnalyticsService;

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
        whatsappWebhookSignatureRequired: false,
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
      analyticsServiceMock,
      inboundQueueServiceMock,
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
        whatsappWebhookSignatureRequired: false,
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
      analyticsServiceMock,
      inboundQueueServiceMock,
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
        whatsappWebhookSignatureRequired: false,
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
      analyticsServiceMock,
      inboundQueueServiceMock,
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

  it('rejects webhook payload when signature check is enabled and header is invalid', async () => {
    const service = new WhatsAppWebhookService(
      {
        verifyWebhook: jest.fn(),
        sendTextMessage: jest.fn(),
      },
      parser,
      {
        createInboundDedupKey: jest.fn().mockReturnValue('dedup-1'),
        isDuplicate: jest.fn().mockResolvedValue(false),
      } as unknown as WhatsAppDedupService,
      {
        whatsappWebhookVerifyToken: 'verify-token',
        whatsappWebhookSignatureRequired: true,
        whatsappAppSecret: appSecret,
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
      analyticsServiceMock,
      inboundQueueServiceMock,
    );

    await expect(
      service.ingestWebhook(
        {
          object: 'whatsapp_business_account',
          entry: [],
        },
        {
          signatureHeader:
            'sha256=0000000000000000000000000000000000000000000000000000000000000000',
          rawBody: Buffer.from(
            JSON.stringify({
              object: 'whatsapp_business_account',
              entry: [],
            }),
          ),
        },
      ),
    ).rejects.toThrow(InvalidWebhookChallengeException);
  });

  it('accepts webhook payload when signature is valid', async () => {
    const service = new WhatsAppWebhookService(
      {
        verifyWebhook: jest.fn(),
        sendTextMessage: jest.fn(),
      },
      parser,
      {
        createInboundDedupKey: jest.fn().mockReturnValue('dedup-1'),
        isDuplicate: jest.fn().mockResolvedValue(false),
      } as unknown as WhatsAppDedupService,
      {
        whatsappWebhookVerifyToken: 'verify-token',
        whatsappWebhookSignatureRequired: true,
        whatsappAppSecret: appSecret,
      } as AppConfigService,
      connectionServiceMock,
      conversationsServiceMock,
      messagesServiceMock,
      messageStatusServiceMock,
      analyticsServiceMock,
      inboundQueueServiceMock,
    );

    const payload = {
      object: 'whatsapp_business_account',
      entry: [],
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const result = await service.ingestWebhook(payload, {
      signatureHeader: `sha256=${signature}`,
      rawBody,
    });

    expect(result.received).toBe(true);
  });
});
