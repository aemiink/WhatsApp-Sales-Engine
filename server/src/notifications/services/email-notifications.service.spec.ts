import { NotificationType } from '@prisma/client';
import { EmailNotificationsService } from './email-notifications.service';

describe('EmailNotificationsService', () => {
  it('sends email through resend api when configuration exists', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 're_123',
        }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });

    const service = new EmailNotificationsService({
      resendApiKey: 're_test',
      emailFromAddress: 'notifications@example.com',
      appBaseUrl: 'https://app.example.com',
    } as never);

    const result = await service.sendNotificationEmail({
      type: NotificationType.LEAD_HOT,
      title: 'Hot lead',
      message: 'Yeni hot lead',
      payload: {
        conversationId: 'conv-1',
      },
      recipients: ['ops@example.com'],
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(result.sent).toBe(true);
    expect(result.providerMessageId).toBe('re_123');
  });

  it('skips email when resend configuration is missing', async () => {
    const service = new EmailNotificationsService({
      resendApiKey: undefined,
      emailFromAddress: undefined,
      appBaseUrl: 'https://app.example.com',
    } as never);

    const result = await service.sendNotificationEmail({
      type: NotificationType.CONNECTION_ERROR,
      title: 'Connection issue',
      message: 'test',
      payload: null,
      recipients: ['ops@example.com'],
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('missing_resend_configuration');
  });
});
