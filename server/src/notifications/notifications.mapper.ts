import { Notification } from '@prisma/client';

export interface NotificationDto {
  id: string;
  workspaceId: string;
  userId: string | null;
  type: string;
  channel: string;
  title: string;
  message: string;
  isRead: boolean;
  payload: Record<string, unknown> | null;
  emailSentAt: string | null;
  createdAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toNotificationDto(row: Notification): NotificationDto {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId ?? null,
    type: row.type,
    channel: row.channel,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    payload: isRecord(row.payloadJson) ? row.payloadJson : null,
    emailSentAt: row.emailSentAt ? row.emailSentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
