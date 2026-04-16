import { useCallback, useEffect, useMemo, useState } from 'react';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  payload: Record<string, unknown> | null;
}

interface RealtimeNotificationEvent {
  kind: 'created' | 'read' | 'read_all';
  workspaceId: string;
  userId?: string | null;
  notification?: AppNotification;
  notificationId?: string;
  updatedCount?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const fallbackNotifications: AppNotification[] = [
  {
    id: 'fallback-1',
    type: 'LEAD_HOT',
    title: 'Yeni hot lead tespit edildi',
    message: 'Demo talebi veren musteri icin hizli takip onerilir.',
    isRead: false,
    createdAt: new Date().toISOString(),
    payload: {
      routePath: '/chat',
    },
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapNotification(input: unknown): AppNotification | null {
  if (!isRecord(input)) {
    return null;
  }

  const id = typeof input.id === 'string' ? input.id : null;
  const title = typeof input.title === 'string' ? input.title : null;
  const message = typeof input.message === 'string' ? input.message : null;
  const type = typeof input.type === 'string' ? input.type : 'INFO';
  const createdAt =
    typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString();
  const isRead = typeof input.isRead === 'boolean' ? input.isRead : false;

  if (!id || !title || !message) {
    return null;
  }

  return {
    id,
    type,
    title,
    message,
    createdAt,
    isRead,
    payload: isRecord(input.payload) ? input.payload : null,
  };
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
  const [usingFallback, setUsingFallback] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [listResponse, countResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/notifications?limit=20`),
        fetch(`${API_BASE_URL}/notifications/unread-count`),
      ]);

      if (!listResponse.ok || !countResponse.ok) {
        throw new Error('Notification fetch failed');
      }

      const listJson = (await listResponse.json()) as unknown;
      const countJson = (await countResponse.json()) as unknown;

      const list = Array.isArray(listJson)
        ? listJson
            .map((entry) => mapNotification(entry))
            .filter((entry): entry is AppNotification => entry !== null)
        : [];

      const unread =
        isRecord(countJson) && typeof countJson.unreadCount === 'number'
          ? countJson.unreadCount
          : list.filter((entry) => !entry.isRead).length;

      setNotifications(list);
      setUnreadCount(unread);
      setUsingFallback(false);
    } catch {
      if (!usingFallback) {
        setNotifications(fallbackNotifications);
        setUnreadCount(fallbackNotifications.filter((entry) => !entry.isRead).length);
        setUsingFallback(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [usingFallback]);

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
    let source: EventSource | null = null;

    try {
      source = new EventSource(`${API_BASE_URL}/notifications/stream`);
      source.onmessage = (event) => {
        const parsed = JSON.parse(event.data) as RealtimeNotificationEvent;
        if (parsed.kind === 'created' && parsed.notification) {
          setNotifications((prev) => [parsed.notification!, ...prev].slice(0, 40));
          if (!parsed.notification.isRead) {
            setUnreadCount((value) => value + 1);
          }
        }

        if (parsed.kind === 'read' && parsed.notificationId) {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === parsed.notificationId ? { ...item, isRead: true } : item,
            ),
          );
          setUnreadCount((value) => Math.max(0, value - 1));
        }

        if (parsed.kind === 'read_all') {
          setNotifications((prev) =>
            prev.map((item) => ({
              ...item,
              isRead: true,
            })),
          );
          setUnreadCount(0);
        }
      };

      source.onerror = () => {
        source?.close();
      };
    } catch {
      source?.close();
    }

    return () => {
      source?.close();
    };
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
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
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
    } catch {
      // Fail silently and keep optimistic state.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );
    setUnreadCount(0);

    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
      });
    } catch {
      // Fail silently and keep optimistic state.
    }
  }, []);

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
