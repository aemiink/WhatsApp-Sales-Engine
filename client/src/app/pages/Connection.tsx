import { useState } from 'react';
import { Link2, RefreshCw, Smartphone, TestTube2, Unplug } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorState, LoadingState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';

export function Connection() {
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const runConnectionTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
    }, 1400);
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <PageHeader
          title="WhatsApp Connection"
          description="Baglanti durumunu teknik jargon olmadan gor, test et, gerekirse yeniden bagla."
          badge={isConnected ? 'Baglanti aktif' : 'Baglanti yok'}
          helpKey="connection"
        />

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
                <p className="text-sm text-muted-foreground">
                  {isConnected
                    ? 'Numara aktif, mesaj alimi ve gonderimi calisiyor.'
                    : 'Mesaj akisi durmus olabilir. Asagidaki aksiyonlarla yeniden baglan.'}
                </p>
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
                <p className="text-xs text-muted-foreground">Business name</p>
                <p className="text-sm font-semibold">Prompta AI Sales</p>
              </article>
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Phone number</p>
                <p className="text-sm font-semibold">+90 532 123 45 67</p>
              </article>
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Last heartbeat</p>
                <p className="text-sm font-semibold">30 sn once</p>
              </article>
              <article className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Failure count today</p>
                <p className="text-sm font-semibold">0</p>
              </article>
            </div>
          ) : (
            <ErrorState
              title="WhatsApp baglantisi dogrulanamadi"
              description="Yetkilendirme tokeni sure asimina ugradi veya oturum kesildi. Yeniden baglan aksiyonunu calistir."
            />
          )}
        </section>

        <section className="mb-6 rounded-xl border border-border bg-card/60 p-5">
          <h2 className="mb-3 text-xl font-bold">Hizli aksiyonlar</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              onClick={runConnectionTest}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60"
            >
              <TestTube2 className="h-4 w-4" />
              Test connection
            </button>
            <button
              onClick={() => setIsConnected(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60"
            >
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </button>
            <button
              onClick={() => setIsConnected(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20"
            >
              <Unplug className="h-4 w-4" />
              Remove connection
            </button>
          </div>
        </section>

        {isTesting ? (
          <section className="mb-6">
            <LoadingState
              title="Baglanti testi calisiyor"
              description="Webhook endpoint, token ve mesaj gonderim rotasi dogrulaniyor."
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
                Baglanti testinden sonra 2 dakikayi gecen kesinti varsa yeniden
                yetkilendirme yap.
              </p>
            </li>
            <li className="rounded-lg border border-border bg-secondary/35 p-3">
              Hata devam ederse webhook token ve telefon numarasi id alanlarini
              server tarafinda tekrar dogrula.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
