import { CheckCircle2, ArrowRight, BarChart3, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';

const completedItems = [
  'Website analyzed',
  'Instagram analyzed',
  'Sales style ready',
  'FAQ / rules loaded',
];

export function AIReady() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18] p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card/70 p-6 md:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/15">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">AI sistemin hazir</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Onboarding tamamlandi. AI artik canli konusmalarda marka tonunla
            cevap uretebilir.
          </p>
        </div>

        <section className="mb-6 grid gap-3 sm:grid-cols-2">
          {completedItems.map((item) => (
            <article key={item} className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </p>
            </article>
          ))}
        </section>

        <section className="mb-6 rounded-lg border border-primary/35 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">Neler ogrenildi?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Marka dili, urun konumlandirmasi, itiraz kaliplari ve handoff
            kurallari AI karar motoruna eklendi.
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-black hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
            Canli Sohbetlere Gec
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/45 px-4 py-3 text-sm font-semibold hover:bg-secondary/65"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard'a Git
          </button>
        </div>

        <button
          onClick={() => navigate('/ai-knowledge')}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          AI bilgi merkezini ac
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
