import { NotificationChannel, NotificationType } from '@prisma/client';
import { RealtimeNotificationsService } from '../../../src/notifications/services/realtime-notifications.service';
import { NotificationsService } from '../../../src/notifications/services/notifications.service';

interface StoredNotification {
  id: string;
  workspaceId: string;
  userId: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  payloadJson: Record<string, unknown> | null;
  emailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationOrFilter {
  userId: string | null;
}

interface NotificationWhereFilter {
  id?: string;
  workspaceId: string;
  OR: NotificationOrFilter[];
  isRead?: boolean;
}

interface NotificationCreateArgs {
  data: {
    workspaceId: string;
    userId?: string | null;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    payloadJson?: unknown;
  };
}

interface NotificationFindManyArgs {
  where: NotificationWhereFilter;
  take?: number;
}

interface NotificationCountArgs {
  where: NotificationWhereFilter;
}

interface NotificationUpdateManyArgs {
  where: NotificationWhereFilter;
  data: {
    isRead?: boolean;
  };
}

interface NotificationFindUniqueArgs {
  where: {
    id: string;
  };
}

interface NotificationUpdateArgs {
  where: {
    id: string;
  };
  data: {
    emailSentAt?: Date | null;
  };
}

function asPayloadJson(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function createInMemoryPrisma() {
  const rows: StoredNotification[] = [];
  let sequence = 0;

  function now() {
    return new Date('2026-04-17T00:00:00.000Z');
  }

  return {
    rows,
    prisma: {
      notification: {
        create: jest.fn().mockImplementation((args: NotificationCreateArgs) => {
          const { data } = args;
          sequence += 1;
          const row: StoredNotification = {
            id: `n-${sequence}`,
            workspaceId: data.workspaceId,
            userId: data.userId ?? null,
            type: data.type,
            channel: data.channel,
            title: data.title,
            message: data.message,
            isRead: false,
            payloadJson: asPayloadJson(data.payloadJson),
            emailSentAt: null,
            createdAt: now(),
            updatedAt: now(),
          };
          rows.push(row);
          return Promise.resolve(row);
        }),
        findMany: jest
          .fn()
          .mockImplementation((args: NotificationFindManyArgs) => {
            const { where } = args;
            const take =
              typeof args.take === 'number' ? args.take : rows.length;

            const scoped = rows.filter((row) => {
              if (row.workspaceId !== where.workspaceId) {
                return false;
              }

              const allowedUserIds = where.OR.map((entry) => entry.userId);
              if (!allowedUserIds.includes(row.userId)) {
                return false;
              }

              if (
                typeof where.isRead === 'boolean' &&
                row.isRead !== where.isRead
              ) {
                return false;
              }

              return true;
            });

            return Promise.resolve(scoped.slice(0, take));
          }),
        count: jest.fn().mockImplementation((args: NotificationCountArgs) => {
          const { where } = args;
          const scoped = rows.filter((row) => {
            if (row.workspaceId !== where.workspaceId) {
              return false;
            }

            const allowedUserIds = where.OR.map((entry) => entry.userId);
            if (!allowedUserIds.includes(row.userId)) {
              return false;
            }

            if (
              typeof where.isRead === 'boolean' &&
              row.isRead !== where.isRead
            ) {
              return false;
            }

            return true;
          });

          const count = scoped.length;

          return Promise.resolve(count);
        }),
        updateMany: jest
          .fn()
          .mockImplementation((args: NotificationUpdateManyArgs) => {
            const { where, data } = args;
            let count = 0;
            for (const row of rows) {
              if (where.id && row.id !== where.id) {
                continue;
              }
              if (row.workspaceId !== where.workspaceId) {
                continue;
              }
              const allowedUserIds = where.OR.map((entry) => entry.userId);
              if (!allowedUserIds.includes(row.userId)) {
                continue;
              }
              if (
                typeof where.isRead === 'boolean' &&
                row.isRead !== where.isRead
              ) {
                continue;
              }

              if (typeof data.isRead === 'boolean') {
                row.isRead = data.isRead;
              }
              row.updatedAt = now();
              count += 1;
            }

            return Promise.resolve({ count });
          }),
        findUniqueOrThrow: jest
          .fn()
          .mockImplementation((args: NotificationFindUniqueArgs) => {
            const row = rows.find((entry) => entry.id === args.where.id);
            if (!row) {
              throw new Error('not found');
            }

            return Promise.resolve(row);
          }),
        update: jest.fn().mockImplementation((args: NotificationUpdateArgs) => {
          const row = rows.find((entry) => entry.id === args.where.id);
          if (!row) {
            throw new Error('not found');
          }

          row.emailSentAt = args.data.emailSentAt ?? row.emailSentAt;
          row.updatedAt = now();
          return Promise.resolve(row);
        }),
      },
      workspaceMember: {
        findFirst: jest.fn().mockResolvedValue({
          user: {
            email: 'agent@example.com',
          },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            user: {
              email: 'agent@example.com',
            },
          },
        ]),
      },
    },
  };
}

describe('NotificationsService (integration)', () => {
  it('supports create -> list -> mark read flow and realtime push', async () => {
    const { prisma } = createInMemoryPrisma();
    const realtime = new RealtimeNotificationsService();
    const emailServiceMock = {
      sendNotificationEmail: jest.fn().mockResolvedValue({
        sent: true,
      }),
    };

    const service = new NotificationsService(
      prisma as never,
      realtime,
      emailServiceMock as never,
    );

    const events: string[] = [];
    const subscription = realtime.stream().subscribe((event) => {
      events.push(event.kind);
    });

    await service.createAndDispatch({
      workspaceId: 'ws-1',
      userId: null,
      type: NotificationType.LEAD_HOT,
      channel: NotificationChannel.BOTH,
      title: 'Hot lead',
      message: 'Yeni hot lead',
      payload: {
        conversationId: 'conv-1',
      },
    });

    const listed = await service.listForUser({
      workspaceId: 'ws-1',
      userId: 'user-1',
      query: {
        limit: 20,
        onlyUnread: true,
      },
    });
    expect(listed).toHaveLength(1);
    expect(listed[0].isRead).toBe(false);

    const unreadCount = await service.getUnreadCount('ws-1', 'user-1');
    expect(unreadCount).toBe(1);

    await service.markAsRead('ws-1', 'user-1', listed[0].id);
    const unreadAfter = await service.getUnreadCount('ws-1', 'user-1');
    expect(unreadAfter).toBe(0);

    await service.markAllAsRead('ws-1', 'user-1');
    expect(events).toEqual(expect.arrayContaining(['created', 'read']));
    expect(emailServiceMock.sendNotificationEmail).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });
});
