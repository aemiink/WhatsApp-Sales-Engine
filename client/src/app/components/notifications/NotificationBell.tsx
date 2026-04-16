import { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useNotifications } from './useNotifications';

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes} dk once`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} saat once`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gun once`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    routeFor,
    refresh,
  } = useNotifications();

  const onClickNotification = async (notificationId: string, route: string) => {
    await markAsRead(notificationId);
    setOpen(false);
    navigate(route);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground"
        aria-label="Bildirim panelini ac"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-primary" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Bildirimler</span>
        {unreadCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-black">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[90] w-[380px] rounded-xl border border-border bg-[#131722] p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                Kritik olaylar ve operasyon sinyalleri
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void refresh()}
                className="rounded-lg border border-border bg-secondary/40 p-2 text-muted-foreground hover:text-foreground"
                aria-label="Bildirimleri yenile"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => void markAllAsRead()}
                className="rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Tumunu okundu yap
              </button>
            </div>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
            {isLoading ? (
              <div className="rounded-lg border border-border bg-secondary/35 p-3 text-xs text-muted-foreground">
                Bildirimler yukleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/35 p-3 text-xs text-muted-foreground">
                Su an yeni bildirim yok.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    void onClickNotification(
                      notification.id,
                      routeFor(notification),
                    )
                  }
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    notification.isRead
                      ? 'border-border bg-secondary/35'
                      : 'border-primary/35 bg-primary/10'
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    {!notification.isRead ? (
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    ) : null}
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    {notification.isRead ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCheck className="h-3 w-3 text-primary" />
                        okundu
                      </span>
                    ) : (
                      <span className="text-primary">yeni</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
