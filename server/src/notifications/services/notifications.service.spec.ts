import { NotFoundException } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';

function createNotificationRow() {
  const now = new Date('2026-04-17T00:00:00.000Z');

  return {
    id: 'n-1',
    workspaceId: 'ws-1',
    userId: null,
    type: NotificationType.LEAD_HOT,
    channel: NotificationChannel.BOTH,
    title: 'Yeni hot lead',
    message: 'Takip et',
    isRead: false,
    payloadJson: {
      conversationId: 'conv-1',
    },
    emailSentAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('NotificationsService', () => {
  it('creates notification, pushes realtime and triggers email when channel is both', async () => {
    const row = createNotificationRow();

    const prismaMock = {
      notification: {
        create: jest.fn().mockResolvedValue(row),
        findUniqueOrThrow: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockResolvedValue({
          ...row,
          emailSentAt: new Date('2026-04-17T00:05:00.000Z'),
        }),
      },
      workspaceMember: {
        findMany: jest.fn().mockResolvedValue([
          {
            user: {
              email: 'admin@example.com',
            },
          },
        ]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const realtimeMock = {
      publish: jest.fn(),
    };

    const emailMock = {
      sendNotificationEmail: jest.fn().mockResolvedValue({
        sent: true,
        providerMessageId: 're_1',
      }),
    };

    const service = new NotificationsService(
      prismaMock as never,
      realtimeMock as never,
      emailMock as never,
    );

    const result = await service.createAndDispatch({
      workspaceId: 'ws-1',
      type: NotificationType.LEAD_HOT,
      channel: NotificationChannel.BOTH,
      title: 'Yeni hot lead',
      message: 'Takip et',
      payload: {
        conversationId: 'conv-1',
      },
    });

    expect(prismaMock.notification.create).toHaveBeenCalled();
    expect(realtimeMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'created',
        workspaceId: 'ws-1',
      }),
    );
    expect(emailMock.sendNotificationEmail).toHaveBeenCalled();
    expect(prismaMock.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'n-1',
        },
      }),
    );
    expect(result.id).toBe('n-1');
  });

  it('throws not found when marking unknown notification as read', async () => {
    const prismaMock = {
      notification: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const service = new NotificationsService(
      prismaMock as never,
      {
        publish: jest.fn(),
      } as never,
      {
        sendNotificationEmail: jest.fn(),
      } as never,
    );

    await expect(
      service.markAsRead('ws-1', 'user-1', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
