import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../../lib/api/apiClient';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
  type NotificationsStreamEvent,
} from '../../lib/api/services';
import { tokenStorage } from '../../lib/auth/tokenStorage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStreamEvent(payload: unknown): NotificationsStreamEvent | null {
  if (!isRecord(payload) || typeof payload.kind !== 'string') {
    return null;
  }

  if (payload.kind === 'created') {
    if (!isRecord(payload.notification)) {
      return null;
    }

    const notification = payload.notification;
    if (
      typeof notification.id !== 'string' ||
      typeof notification.title !== 'string' ||
      typeof notification.message !== 'string'
    ) {
      return null;
    }

    return {
      kind: 'created',
      workspaceId:
        typeof payload.workspaceId === 'string'
          ? payload.workspaceId
          : 'unknown-workspace',
      userId: typeof payload.userId === 'string' ? payload.userId : null,
      notification: {
        id: notification.id,
        type: typeof notification.type === 'string' ? notification.type : 'INFO',
        title: notification.title,
        message: notification.message,
        isRead:
          typeof notification.isRead === 'boolean' ? notification.isRead : false,
        createdAt:
          typeof notification.createdAt === 'string'
            ? notification.createdAt
            : new Date().toISOString(),
        payload: isRecord(notification.payload) ? notification.payload : null,
      },
    };
  }

  if (
    payload.kind === 'read' &&
    typeof payload.workspaceId === 'string' &&
    typeof payload.userId === 'string' &&
    typeof payload.notificationId === 'string'
  ) {
    return {
      kind: 'read',
      workspaceId: payload.workspaceId,
      userId: payload.userId,
      notificationId: payload.notificationId,
    };
  }

  if (
    payload.kind === 'read_all' &&
    typeof payload.workspaceId === 'string' &&
    typeof payload.userId === 'string' &&
    typeof payload.updatedCount === 'number'
  ) {
    return {
      kind: 'read_all',
      workspaceId: payload.workspaceId,
      userId: payload.userId,
      updatedCount: payload.updatedCount,
    };
  }

  return null;
}

function routeFromNotification(notification: AppNotification): string {
  const payloadRoute =
    notification.payload && typeof notification.payload.routePath === 'string'
      ? notification.payload.routePath
      : null;
  if (payloadRoute) {
    return payloadRoute;
  }

  if (
    notification.type === 'LEAD_HOT' ||
    notification.type === 'HANDOFF_STARTED' ||
    notification.type === 'REPLY_FAILED'
  ) {
    return '/chat';
  }

  if (notification.type === 'CONNECTION_ERROR') {
    return '/connection';
  }

  return '/analytics';
}

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  routeFor: (notification: AppNotification) => string;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const streamHealthyRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([
        fetchNotifications(20),
        fetchUnreadNotificationCount(),
      ]);

      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    const tokens = tokenStorage.read();
    if (!tokens?.accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    const start = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          streamHealthyRef.current = false;
          return;
        }

        streamHealthyRef.current = true;

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const chunk = await reader.read();
          if (chunk.done) {
            break;
          }

          buffer += decoder.decode(chunk.value, { stream: true });

          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            const rawEvent = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');

            if (!rawEvent) {
              continue;
            }

            const dataLines = rawEvent
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.replace(/^data:\s?/, ''));

            if (dataLines.length === 0) {
              continue;
            }

            const joined = dataLines.join('\n');
            let parsedJson: unknown;
            try {
              parsedJson = JSON.parse(joined);
            } catch {
              continue;
            }

            const parsed = parseStreamEvent(parsedJson);
            if (!parsed) {
              continue;
            }

            if (parsed.kind === 'created') {
              setNotifications((prev) => {
                if (prev.some((item) => item.id === parsed.notification.id)) {
                  return prev;
                }
                return [parsed.notification, ...prev].slice(0, 50);
              });
              if (!parsed.notification.isRead) {
                setUnreadCount((value) => value + 1);
              }
              continue;
            }

            if (parsed.kind === 'read') {
              setNotifications((prev) =>
                prev.map((item) =>
                  item.id === parsed.notificationId
                    ? {
                        ...item,
                        isRead: true,
                      }
                    : item,
                ),
              );
              setUnreadCount((value) => Math.max(0, value - 1));
              continue;
            }

            setNotifications((prev) =>
              prev.map((item) => ({
                ...item,
                isRead: true,
              })),
            );
            setUnreadCount(0);
          }
        }
      } catch {
        streamHealthyRef.current = false;
      }
    };

    void start();

    return () => {
      controller.abort();
    };
  }, [refresh]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
      setUnreadCount((value) => Math.max(0, value - 1));

      try {
        await markNotificationAsRead(notificationId);
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      await refresh();
    }
  }, [refresh]);

  return useMemo(() => {
    return {
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      routeFor: routeFromNotification,
      refresh,
    };
  }, [notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refresh]);
}
