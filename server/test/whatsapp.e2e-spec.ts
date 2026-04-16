import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { WHATSAPP_PROVIDER_TOKEN } from '../src/whatsapp/providers/whatsapp-provider.interface';

describe('WhatsApp Module (e2e)', () => {
  let app: INestApplication<App> | undefined;

  const providerMock = {
    sendTextMessage: jest.fn(),
    verifyWebhook: jest.fn(),
  };

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WHATSAPP_PROVIDER_TOKEN)
      .useValue(providerMock)
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

  it('GET /webhooks/whatsapp returns 403 when verification fails', async () => {
    providerMock.verifyWebhook.mockReturnValue({
      ok: false,
      reason: 'verify token mismatch',
    });

    const response = await request(app!.getHttpServer())
      .get(
        '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345',
      )
      .expect(403);

    const body = response.body as { code: string };
    expect(body.code).toBe('WHATSAPP_INVALID_WEBHOOK_CHALLENGE');
  });

  it('POST /webhooks/whatsapp ingests and normalizes inbound payload', async () => {
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

    const response = await request(app!.getHttpServer())
      .post('/webhooks/whatsapp')
      .send(payload)
      .expect(200);

    const body = response.body as {
      received: boolean;
      eventCount: number;
      events: Array<{ normalizedEvent: { eventType: string } }>;
    };

    expect(body.received).toBe(true);
    expect(body.eventCount).toBe(1);
    expect(body.events[0]?.normalizedEvent.eventType).toBe('message');
  });

  it('POST /whatsapp/messages/send sends message via provider', async () => {
    providerMock.sendTextMessage.mockResolvedValue({
      messagingProduct: 'whatsapp',
      contacts: [{ input: '905551112233', waId: '905551112233' }],
      messages: [{ id: 'wamid.2' }],
      rawResponse: {
        messages: [{ id: 'wamid.2' }],
      },
    });

    const response = await request(app!.getHttpServer())
      .post('/whatsapp/messages/send')
      .send({
        to: '905551112233',
        text: 'Test mesajı',
      })
      .expect(200);

    expect(providerMock.sendTextMessage).toHaveBeenCalledWith({
      to: '905551112233',
      text: 'Test mesajı',
      workspaceId: undefined,
    });

    const body = response.body as { messages: Array<{ id: string }> };
    expect(body.messages[0]?.id).toBe('wamid.2');
  });
});
