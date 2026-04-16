import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Notification,
  NotificationChannel,
  NotificationType,
  WorkspaceRole,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { NotificationDto, toNotificationDto } from '../notifications.mapper';
import {
  RealtimeNotificationEvent,
  RealtimeNotificationsService,
} from './realtime-notifications.service';
import { EmailNotificationsService } from './email-notifications.service';

interface CreateNotificationInput {
  workspaceId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown> | null;
  channel?: NotificationChannel;
}

interface ListForUserInput {
  workspaceId: string;
  userId: string;
  query: ListNotificationsQueryDto;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeNotificationsService: RealtimeNotificationsService,
    private readonly emailNotificationsService: EmailNotificationsService,
  ) {}

  async createAndDispatch(
    input: CreateNotificationInput,
  ): Promise<NotificationDto> {
    const created = await this.prisma.notification.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId ?? null,
        type: input.type,
        channel: input.channel ?? NotificationChannel.IN_APP,
        title: input.title,
        message: input.message,
        payloadJson: input.payload
          ? (input.payload as Prisma.InputJsonValue)
          : undefined,
      },
    });

    this.logger.log(
      `Notification created type=${created.type} workspaceId=${created.workspaceId} channel=${created.channel}`,
    );

    if (this.shouldPublishInApp(created.channel)) {
      this.publish({
        kind: 'created',
        workspaceId: created.workspaceId,
        userId: created.userId,
        notification: toNotificationDto(created),
      });
    }

    if (this.shouldSendEmail(created.channel)) {
      await this.trySendEmail(created);
    }

    const fresh = await this.prisma.notification.findUniqueOrThrow({
      where: {
        id: created.id,
      },
    });

    return toNotificationDto(fresh);
  }

  async listForUser(input: ListForUserInput): Promise<NotificationDto[]> {
    const limit = input.query.limit ?? 25;
    const onlyUnread = input.query.onlyUnread ?? false;

    const rows = await this.prisma.notification.findMany({
      where: {
        workspaceId: input.workspaceId,
        OR: [{ userId: null }, { userId: input.userId }],
        ...(onlyUnread ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return rows.map((row) => toNotificationDto(row));
  }

  async getUnreadCount(workspaceId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        workspaceId,
        OR: [{ userId: null }, { userId }],
        isRead: false,
      },
    });
  }

  async markAsRead(
    workspaceId: string,
    userId: string,
    notificationId: string,
  ): Promise<NotificationDto> {
    const updated = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        workspaceId,
        OR: [{ userId: null }, { userId }],
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    this.publish({
      kind: 'read',
      workspaceId,
      userId,
      notificationId,
    });

    const refreshed = await this.prisma.notification.findUniqueOrThrow({
      where: {
        id: notificationId,
      },
    });

    this.logger.log(
      `Notification read id=${notificationId} workspaceId=${workspaceId}`,
    );

    return toNotificationDto(refreshed);
  }

  async markAllAsRead(
    workspaceId: string,
    userId: string,
  ): Promise<{ updatedCount: number }> {
    const updated = await this.prisma.notification.updateMany({
      where: {
        workspaceId,
        OR: [{ userId: null }, { userId }],
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    if (updated.count > 0) {
      this.publish({
        kind: 'read_all',
        workspaceId,
        userId,
        updatedCount: updated.count,
      });
    }

    this.logger.log(
      `Notification read_all workspaceId=${workspaceId} updatedCount=${updated.count}`,
    );

    return {
      updatedCount: updated.count,
    };
  }

  private publish(event: RealtimeNotificationEvent): void {
    this.realtimeNotificationsService.publish(event);
    this.logger.debug(
      `Realtime push attempted kind=${event.kind} workspaceId=${event.workspaceId}`,
    );
  }

  private shouldPublishInApp(channel: NotificationChannel): boolean {
    return (
      channel === NotificationChannel.IN_APP ||
      channel === NotificationChannel.BOTH
    );
  }

  private shouldSendEmail(channel: NotificationChannel): boolean {
    return (
      channel === NotificationChannel.EMAIL ||
      channel === NotificationChannel.BOTH
    );
  }

  private async trySendEmail(notification: Notification): Promise<void> {
    const recipients = await this.resolveEmailRecipients(
      notification.workspaceId,
      notification.userId,
    );

    const result = await this.emailNotificationsService.sendNotificationEmail({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      payload:
        typeof notification.payloadJson === 'object' &&
        notification.payloadJson !== null &&
        !Array.isArray(notification.payloadJson)
          ? (notification.payloadJson as Record<string, unknown>)
          : null,
      recipients,
    });

    if (!result.sent) {
      this.logger.warn(
        `Email send failed type=${notification.type} workspaceId=${notification.workspaceId} reason=${result.reason ?? 'unknown'}`,
      );
      return;
    }

    await this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        emailSentAt: new Date(),
      },
    });
  }

  private async resolveEmailRecipients(
    workspaceId: string,
    userId: string | null,
  ): Promise<string[]> {
    if (userId) {
      const targeted = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId,
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (targeted?.user.email) {
        return [targeted.user.email];
      }
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        role: {
          in: [WorkspaceRole.ADMIN, WorkspaceRole.AGENT],
        },
      },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: 10,
    });

    const unique = new Set<string>();
    for (const member of members) {
      if (member.user.email) {
        unique.add(member.user.email);
      }
    }

    return [...unique];
  }
}
