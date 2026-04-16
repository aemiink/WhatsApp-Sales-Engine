import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ConversationsService } from '../src/conversations/conversations.service';
import { MessageStatusService } from '../src/conversations/message-status.service';
import { MessagesService } from '../src/conversations/messages.service';
import { ExecutionService } from '../src/execution/services/execution.service';
import { WHATSAPP_PROVIDER_TOKEN } from '../src/whatsapp/providers/whatsapp-provider.interface';
import { WhatsAppConnectionService } from '../src/whatsapp/services/whatsapp-connection.service';
import { WhatsAppDedupService } from '../src/whatsapp/services/whatsapp-dedup.service';

type LeadStage = 'NEW';
type ConversationStatus = 'ACTIVE';
type SenderType = 'USER' | 'AI';
type MessageDirection = 'INBOUND' | 'OUTBOUND';
type MessageType = 'TEXT' | 'STATUS' | 'UNKNOWN';
type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'RECEIVED' | 'UNKNOWN';

interface StoredConversation {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  leadStage: LeadStage;
  status: ConversationStatus;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredMessage {
  id: string;
  conversationId: string;
  externalMessageId: string | null;
  senderType: SenderType;
  direction: MessageDirection;
  messageType: MessageType;
  content: string | null;
  rawPayload: unknown;
  status: MessageStatus;
  timestamp: Date | null;
  createdAt: Date;
}

function now(): Date {
  return new Date();
}

describe('WhatsApp Module (e2e)', () => {
  let app: INestApplication<App> | undefined;

  const providerMock = {
    sendTextMessage: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  const state: {
    conversations: StoredConversation[];
    messages: StoredMessage[];
    dedupKeys: Set<string>;
    sequence: number;
  } = {
    conversations: [],
    messages: [],
    dedupKeys: new Set<string>(),
    sequence: 0,
  };

  function nextId(prefix: string): string {
    state.sequence += 1;
    return `${prefix}-${state.sequence}`;
  }

  beforeEach(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.DIRECT_URL ??=
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
    process.env.AI_DEFAULT_PROVIDER ??= 'gemini';
    process.env.GEMINI_API_KEY ??= 'test-gemini-key';

    process.env.WHATSAPP_ACCESS_TOKEN ??= 'test-wa-access-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID ??= '123456789';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ??= 'test-webhook-token';
    process.env.META_GRAPH_API_VERSION ??= 'v21.0';

    providerMock.sendTextMessage.mockReset();
    providerMock.verifyWebhook.mockReset();

    state.conversations.length = 0;
    state.messages.length = 0;
    state.dedupKeys.clear();
    state.sequence = 0;

    const conversationsServiceMock: Pick<
      ConversationsService,
      | 'createConversation'
      | 'findOrCreateByPhone'
      | 'listConversations'
      | 'getConversationDetail'
      | 'getWorkspaceConversations'
    > = {
      createConversation: (input) => {
        const conversation: StoredConversation = {
          id: nextId('conv'),
          workspaceId: input.workspaceId,
          phoneNumber: input.phoneNumber,
          leadStage: 'NEW',
          status: 'ACTIVE',
          lastMessageAt: null,
          createdAt: now(),
          updatedAt: now(),
        };
        state.conversations.push(conversation);
        return Promise.resolve(conversation);
      },
      findOrCreateByPhone: (workspaceId: string, phoneNumber: string) => {
        const existing = state.conversations.find(
          (conversation) =>
            conversation.workspaceId === workspaceId &&
            conversation.phoneNumber === phoneNumber,
        );

        if (existing) {
          return Promise.resolve(existing);
        }

        const created: StoredConversation = {
          id: nextId('conv'),
          workspaceId,
          phoneNumber,
          leadStage: 'NEW',
          status: 'ACTIVE',
          lastMessageAt: null,
          createdAt: now(),
          updatedAt: now(),
        };

        state.conversations.push(created);
        return Promise.resolve(created);
      },
      listConversations: (workspaceId: string) => {
        return Promise.resolve(
          state.conversations
            .filter((conversation) => conversation.workspaceId === workspaceId)
            .map((conversation) => ({
              id: conversation.id,
              phoneNumber: conversation.phoneNumber,
              leadStage: conversation.leadStage,
              status: conversation.status,
              lastMessageAt: conversation.lastMessageAt,
            })),
        );
      },
      getConversationDetail: (conversationId: string) => {
        const conversation = state.conversations.find(
          (entry) => entry.id === conversationId,
        );

        if (!conversation) {
          return Promise.resolve(null);
        }

        return Promise.resolve({
          ...conversation,
          messages: state.messages
            .filter((message) => message.conversationId === conversationId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        });
      },
      getWorkspaceConversations: (workspaceId: string) => {
        return Promise.resolve(
          state.conversations.filter(
            (conversation) => conversation.workspaceId === workspaceId,
          ),
        );
      },
    };

    const messagesServiceMock: Pick<
      MessagesService,
      'createInboundMessage' | 'createOutboundMessage'
    > = {
      createInboundMessage: ({ conversationId, event }) => {
        if (
          event.externalMessageId &&
          state.messages.some(
            (message) => message.externalMessageId === event.externalMessageId,
          )
        ) {
          const duplicateError = new Error('Unique constraint violation');
          (duplicateError as Error & { code: string }).code = 'P2002';
          return Promise.reject(duplicateError);
        }

        const createdAt = now();
        const message: StoredMessage = {
          id: nextId('msg'),
          conversationId,
          externalMessageId: event.externalMessageId,
          senderType: 'USER',
          direction: 'INBOUND',
          messageType: event.messageType === 'text' ? 'TEXT' : 'UNKNOWN',
          content: event.textBody,
          rawPayload: event.rawPayload,
          status: 'RECEIVED',
          timestamp: event.timestamp
            ? new Date(Number(event.timestamp) * 1000)
            : null,
          createdAt,
        };

        state.messages.push(message);

        const conversation = state.conversations.find(
          (entry) => entry.id === conversationId,
        );
        if (conversation) {
          conversation.lastMessageAt = message.timestamp ?? createdAt;
          conversation.updatedAt = now();
        }

        return Promise.resolve(message);
      },
      createOutboundMessage: ({
        conversationId,
        externalMessageId,
        content,
        rawPayload,
        timestamp,
      }) => {
        const createdAt = now();
        const message: StoredMessage = {
          id: nextId('msg'),
          conversationId,
          externalMessageId: externalMessageId ?? null,
          senderType: 'AI',
          direction: 'OUTBOUND',
          messageType: 'TEXT',
          content,
          rawPayload,
          status: 'SENT',
          timestamp: timestamp ?? createdAt,
          createdAt,
        };

        state.messages.push(message);

        const conversation = state.conversations.find(
          (entry) => entry.id === conversationId,
        );
        if (conversation) {
          conversation.lastMessageAt = message.timestamp ?? createdAt;
          conversation.updatedAt = now();
        }

        return Promise.resolve(message);
      },
    };

    const messageStatusServiceMock: Pick<
      MessageStatusService,
      'updateStatusFromEvent'
    > = {
      updateStatusFromEvent: (event) => {
        if (!event.externalMessageId || !event.status) {
          return Promise.resolve(false);
        }

        const message = state.messages.find(
          (entry) => entry.externalMessageId === event.externalMessageId,
        );

        if (!message) {
          return Promise.resolve(false);
        }

        if (event.status === 'sent') {
          message.status = 'SENT';
        } else if (event.status === 'delivered') {
          message.status = 'DELIVERED';
        } else if (event.status === 'read') {
          message.status = 'READ';
        } else if (event.status === 'received') {
          message.status = 'RECEIVED';
        } else {
          message.status = 'UNKNOWN';
        }

        return Promise.resolve(true);
      },
    };

    const dedupServiceMock: Pick<
      WhatsAppDedupService,
      'createInboundDedupKey' | 'isDuplicate'
    > = {
      createInboundDedupKey: (event) => {
        if (event.eventType === 'message' && event.externalMessageId) {
          return `message:${event.externalMessageId}`;
        }

        return `${event.eventType}:${event.externalMessageId ?? 'none'}:${event.timestamp ?? 'none'}:${event.status ?? 'none'}`;
      },
      isDuplicate: (event) => {
        if (event.eventType === 'message' && event.externalMessageId) {
          return Promise.resolve(
            state.messages.some(
              (message) =>
                message.externalMessageId === event.externalMessageId,
            ),
          );
        }

        const key = `${event.eventType}:${event.externalMessageId ?? 'none'}:${event.timestamp ?? 'none'}:${event.status ?? 'none'}`;

        if (state.dedupKeys.has(key)) {
          return Promise.resolve(true);
        }

        state.dedupKeys.add(key);
        return Promise.resolve(false);
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WHATSAPP_PROVIDER_TOKEN)
      .useValue(providerMock)
      .overrideProvider(WhatsAppConnectionService)
      .useValue({
        resolveConnection: jest.fn().mockResolvedValue({
          workspaceId: 'default-workspace',
          accessToken: 'token',
          phoneNumberId: 'phone-number-id',
          webhookVerifyToken: 'test-webhook-token',
          graphApiVersion: 'v21.0',
        }),
      })
      .overrideProvider(ConversationsService)
      .useValue(conversationsServiceMock)
      .overrideProvider(MessagesService)
      .useValue(messagesServiceMock)
      .overrideProvider(MessageStatusService)
      .useValue(messageStatusServiceMock)
      .overrideProvider(WhatsAppDedupService)
      .useValue(dedupServiceMock)
      .overrideProvider(ExecutionService)
      .useValue({
        executeForInboundMessage: jest.fn().mockResolvedValue({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /webhooks/whatsapp returns challenge on successful verification', async () => {
    providerMock.verifyWebhook.mockReturnValue({
      ok: true,
      challenge: '12345',
    });

    await request(app!.getHttpServer())
      .get(
        '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-webhook-token&hub.challenge=12345',
      )
      .expect(200)
      .expect('12345');
  });

  it('POST /webhooks/whatsapp persists inbound messages and exposes conversations read endpoints', async () => {
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

    const ingestResponse = await request(app!.getHttpServer())
      .post('/webhooks/whatsapp')
      .send(payload)
      .expect(200);

    const ingestBody = ingestResponse.body as {
      processedCount: number;
      duplicateCount: number;
    };

    expect(ingestBody.processedCount).toBe(1);
    expect(ingestBody.duplicateCount).toBe(0);

    const listResponse = await request(app!.getHttpServer())
      .get('/conversations?workspaceId=default-workspace')
      .expect(200);

    const conversations = listResponse.body as Array<{
      id: string;
      phoneNumber: string;
    }>;

    expect(conversations).toHaveLength(1);
    expect(conversations[0]?.phoneNumber).toBe('905551112233');

    const detailResponse = await request(app!.getHttpServer())
      .get(`/conversations/${conversations[0]?.id}`)
      .expect(200);

    const detailBody = detailResponse.body as {
      messages: Array<{
        externalMessageId: string;
        content: string;
        status: string;
      }>;
    };

    expect(detailBody.messages).toHaveLength(1);
    expect(detailBody.messages[0]?.externalMessageId).toBe('wamid.1');
    expect(detailBody.messages[0]?.status).toBe('RECEIVED');
  });

  it('POST /webhooks/whatsapp ignores duplicate message events', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'wamid.dup.1',
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

    await request(app!.getHttpServer())
      .post('/webhooks/whatsapp')
      .send(payload)
      .expect(200);

    const second = await request(app!.getHttpServer())
      .post('/webhooks/whatsapp')
      .send(payload)
      .expect(200);

    const body = second.body as {
      processedCount: number;
      duplicateCount: number;
    };

    expect(body.processedCount).toBe(0);
    expect(body.duplicateCount).toBe(1);
  });

  it('status events update existing message lifecycle', async () => {
    providerMock.sendTextMessage.mockResolvedValue({
      messagingProduct: 'whatsapp',
      contacts: [{ input: '905551112233', waId: '905551112233' }],
      messages: [{ id: 'wamid.out.1' }],
      rawResponse: {
        messages: [{ id: 'wamid.out.1' }],
      },
    });

    await request(app!.getHttpServer())
      .post('/whatsapp/messages/send')
      .send({ to: '905551112233', text: 'Test mesajı' })
      .expect(200);

    const statusPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: 'wamid.out.1',
                    status: 'delivered',
                    recipient_id: '905551112233',
                    timestamp: '1710000100',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const statusResponse = await request(app!.getHttpServer())
      .post('/webhooks/whatsapp')
      .send(statusPayload)
      .expect(200);

    const statusBody = statusResponse.body as { processedCount: number };
    expect(statusBody.processedCount).toBe(1);

    const listResponse = await request(app!.getHttpServer())
      .get('/conversations?workspaceId=default-workspace')
      .expect(200);

    const conversations = listResponse.body as Array<{ id: string }>;

    const detailResponse = await request(app!.getHttpServer())
      .get(`/conversations/${conversations[0]?.id}`)
      .expect(200);

    const detailBody = detailResponse.body as {
      messages: Array<{ externalMessageId: string; status: string }>;
    };

    const outbound = detailBody.messages.find(
      (message) => message.externalMessageId === 'wamid.out.1',
    );

    expect(outbound?.status).toBe('DELIVERED');
  });
});
