import {
  AlertTriangle,
  ArrowRight,
  Flame,
  MessageCircle,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';

const operationalKpis = [
  {
    id: 'incoming',
    title: 'Incoming messages today',
    value: '342',
    helper: 'Dune gore +12%',
    icon: MessageCircle,
  },
  {
    id: 'active',
    title: 'Active conversations',
    value: '38',
    helper: 'Anlik takip',
    icon: Users,
  },
  {
    id: 'ai',
    title: 'AI handled conversations',
    value: '31',
    helper: 'Yuzde 81 otonom',
    icon: Sparkles,
  },
  {
    id: 'handoff',
    title: 'Human takeover count',
    value: '7',
    helper: 'Kritik konular',
    icon: UserRoundCheck,
  },
];

const salesKpis = [
  { id: 'qualified', label: 'Qualified leads', value: '28' },
  { id: 'hot', label: 'Hot leads', value: '9' },
  { id: 'conversion', label: 'Conversion rate', value: '%24.8' },
  { id: 'lost', label: 'Lost leads', value: '5' },
];

const liveConversations = [
  {
    id: 1,
    name: 'Ahmet Yilmaz',
    snippet: 'Business paketin ROI hesabini gorebilir miyim?',
    stage: 'hot',
    updatedAt: '1 dk',
  },
  {
    id: 2,
    name: 'Zeynep Demir',
    snippet: 'Fiyat teklifini yoneticiye ilettim, donus yapacagim.',
    stage: 'qualified',
    updatedAt: '4 dk',
  },
  {
    id: 3,
    name: 'Merve Acar',
    snippet: 'Kurulum suresi ve onboarding adimlarini merak ediyorum.',
    stage: 'new',
    updatedAt: '7 dk',
  },
];

const topInsights = [
  {
    id: 'objection',
    title: 'Top objection',
    text: 'Fiyat yuksek algisi son 24 saatte 11 kez goruldu.',
  },
  {
    id: 'faq',
    title: 'Most asked question',
    text: 'Kurulum suresi kac gun? sorusu 19 kez soruldu.',
  },
  {
    id: 'highlight',
    title: 'AI suggestion highlight',
    text: 'Demo daveti eklenen cevaplarin kapanis oranı %16 daha yuksek.',
  },
];

function stageBadge(stage: 'new' | 'qualified' | 'hot') {
  if (stage === 'hot') {
    return <StatusBadge tone="hot" label="hot lead" />;
  }
  if (stage === 'qualified') {
    return <StatusBadge tone="qualified" label="qualified" />;
  }
  return <StatusBadge tone="new" label="new" />;
}

export function Dashboard() {
  const navigate = useNavigate();
  const hasConversations = liveConversations.length > 0;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1500px] p-6 md:p-8">
        <PageHeader
          title="Operations Overview"
          description="Bugun operasyon performansini tek bakista gor, kritik gorusmelere hizli gecis yap."
          badge="AI satış sistemi aktif"
          helpKey="dashboard"
          actions={[
            {
              id: 'chat',
              label: 'Canli Sohbete Gec',
              variant: 'primary',
              icon: <ArrowRight className="h-4 w-4" />,
              onClick: () => navigate('/chat'),
            },
          ]}
        />

        <section className="mb-6 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-primary/10 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">
                Yeni ekip arkadasi eklendi
              </p>
              <p className="text-sm text-muted-foreground">
                Onboarding turunu tamamlamasi icin AI Setup adimlarini paylas.
              </p>
            </div>
            <Link
              to="/ai-setup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black"
            >
              Setup ekranina git
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Operasyonel KPI
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {operationalKpis.map((kpi) => (
              <article
                key={kpi.id}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
                    <kpi.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{kpi.helper}</span>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-4 xl:grid-cols-3">
          <article className="rounded-xl border border-border bg-card/60 p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Sales health snapshot</h2>
                <p className="text-sm text-muted-foreground">
                  Operasyonel rakamlar ile satis metriklerini ayri takip et.
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {salesKpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="rounded-lg border border-border bg-secondary/40 p-4"
                >
                  <p className="mb-1 text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-semibold">{kpi.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="mb-3 text-xl font-bold">Gunluk aksiyonlar</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="rounded-lg border border-border bg-secondary/30 p-3">
                9 hot lead icin manuel takip penceresi ac.
              </li>
              <li className="rounded-lg border border-border bg-secondary/30 p-3">
                Handoff listesinde 3 gorusme 15 dakikayi asti.
              </li>
              <li className="rounded-lg border border-border bg-secondary/30 p-3">
                Yarin 10:00 icin haftalik performans ozeti planla.
              </li>
            </ul>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-xl border border-border bg-card/60 p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Canli konusmalar</h2>
              <Link
                to="/chat"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Tumunu ac
              </Link>
            </div>
            {!hasConversations ? (
              <EmptyState
                title="Aktif konusma yok"
                description="Yeni mesaj geldigi anda buradan canli konusma listesine ulasabilirsin."
              />
            ) : (
              <div className="space-y-3">
                {liveConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="rounded-lg border border-border bg-secondary/35 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold">{conversation.name}</p>
                      <div className="flex items-center gap-2">
                        {stageBadge(conversation.stage)}
                        <span className="text-xs text-muted-foreground">
                          {conversation.updatedAt}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {conversation.snippet}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-xl border border-border bg-card/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">AI Insights</h2>
            </div>
            <div className="space-y-3">
              {topInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-border bg-secondary/35 p-3"
                >
                  <p className="mb-1 text-sm font-semibold">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-red-500/35 bg-red-500/10 p-3">
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-300" />
                <p className="text-sm font-semibold text-red-200">Risk alarmi</p>
              </div>
              <p className="text-xs text-red-100/90">
                2 kritik gorusmede son cevap 10+ dakikadir beklemede.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2">
              <Flame className="h-4 w-4 text-orange-200" />
              <p className="text-xs text-orange-100">
                Hot lead kapanis hedefi: gun sonuna kadar 3 ek demo.
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
