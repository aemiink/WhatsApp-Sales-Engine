import { useState } from 'react';
import {
  Link2,
  RefreshCw,
  Smartphone,
  TestTube2,
  Unplug,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorState, LoadingState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';
import {
  fetchConnectionStatus,
  reconnectWhatsAppConnection,
  removeWhatsAppConnection,
  testWhatsAppConnection,
  type ConnectionActionResponse,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

export function Connection() {
  const statusQuery = useApiQuery(fetchConnectionStatus, []);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (
    key: string,
    action: () => Promise<ConnectionActionResponse>,
  ) => {
    setActionLoading(key);
    setActionMessage(null);
    setActionError(null);

    try {
      const result = await action();
      statusQuery.setData(result.status);
      setActionMessage(result.message);
      await statusQuery.refetch();
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Aksiyon basarisiz.');
    } finally {
      setActionLoading(null);
    }
  };

  if (statusQuery.isLoading) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-5xl p-6 md:p-8">
          <LoadingState
            title="Baglanti durumu yukleniyor"
            description="WhatsApp connection health backend'den aliniyor."
          />
        </div>
      </div>
    );
  }

  if (statusQuery.error || !statusQuery.data) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-5xl p-6 md:p-8">
          <ErrorState
            title="Baglanti durumu alinamadi"
            description={statusQuery.error ?? 'Unknown connection error.'}
            action={
              <button
                onClick={() => {
                  void statusQuery.refetch();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black"
              >
                <RefreshCw className="h-4 w-4" />
                Tekrar dene
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const status = statusQuery.data;
  const isConnected = status.connected;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <PageHeader
          title="WhatsApp Connection"
          description="Baglanti durumunu teknik jargon olmadan gor, test et, gerekirse yeniden bagla."
          badge={isConnected ? 'Baglanti aktif' : 'Baglanti yok'}
          helpKey="connection"
          actions={[
            {
              id: 'refresh',
              label: 'Yenile',
              variant: 'secondary',
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => {
                void statusQuery.refetch();
              },
            },
          ]}
        />

        {actionMessage ? (
          <div className="mb-4 rounded-lg border border-primary/35 bg-primary/10 px-4 py-3 text-sm text-primary">
            {actionMessage}
          </div>
        ) : null}

        {actionError ? (
          <div className="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <section
          className={`mb-6 rounded-xl border p-5 ${
            isConnected
              ? 'border-primary/35 bg-primary/10'
              : 'border-red-500/35 bg-red-500/10'
          }`}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg border p-2.5 ${
                  isConnected
                    ? 'border-primary/40 bg-primary/15'
                    : 'border-red-500/40 bg-red-500/20'
                }`}
              >
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isConnected ? 'Baglanti hazir' : 'Baglanti kesildi'}
                </h2>
                <p className="text-sm text-muted-foreground">{status.health.message}</p>
              </div>
            </div>
            {isConnected ? (
              <StatusBadge tone="active" label="connected" />
            ) : (
              <StatusBadge tone="lost" label="disconnected" />
            )}
          </div>

          {isConnected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Connection source</p>
                <p className="text-sm font-semibold">{status.source}</p>
              </article>
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Phone number</p>
                <p className="text-sm font-semibold">
                  {status.connection?.phoneNumber ?? 'unknown'}
                </p>
              </article>
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Phone number ID</p>
                <p className="text-sm font-semibold">
                  {status.connection?.phoneNumberId ?? 'unknown'}
                </p>
              </article>
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Last health check</p>
                <p className="text-sm font-semibold">
                  {new Date(status.health.checkedAt).toLocaleString('tr-TR')}
                </p>
              </article>
            </div>
          ) : (
            <ErrorState
              title="WhatsApp baglantisi dogrulanamadi"
              description="Baglanti bilgisi eksik veya dogrulama basarisiz. Test/Reconnect aksiyonlarini calistir."
            />
          )}
        </section>

        <section className="mb-6 rounded-xl border border-border bg-card/60 p-5">
          <h2 className="mb-3 text-xl font-bold">Hizli aksiyonlar</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => {
                void runAction('test', testWhatsAppConnection);
              }}
              disabled={actionLoading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-50"
            >
              <TestTube2 className="h-4 w-4" />
              Test connection
            </button>
            <button
              onClick={() => {
                void runAction('reconnect', reconnectWhatsAppConnection);
              }}
              disabled={actionLoading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </button>
            <button
              onClick={() => {
                void runAction('remove', removeWhatsAppConnection);
              }}
              disabled={actionLoading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Unplug className="h-4 w-4" />
              Remove connection
            </button>
          </div>
        </section>

        {actionLoading ? (
          <section className="mb-6">
            <LoadingState
              title="Baglanti aksiyonu calisiyor"
              description="Token, provider ve WhatsApp Graph erisimi dogrulaniyor."
            />
          </section>
        ) : null}

        <section className="rounded-xl border border-border bg-card/60 p-5">
          <h2 className="mb-2 text-xl font-bold">Yardimci notlar</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="rounded-lg border border-border bg-secondary/35 p-3">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                <Link2 className="h-4 w-4 text-primary" />
                Reconnect onerisi
              </p>
              <p className="mt-1">
                Baglanti testi basarisizsa reconnect calistir ve health mesajini kontrol et.
              </p>
            </li>
            <li className="rounded-lg border border-border bg-secondary/35 p-3">
              Hata devam ederse webhook token, phone number id ve access token kayitlarini server tarafinda kontrol et.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
