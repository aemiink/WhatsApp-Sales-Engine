import {
  AlertTriangle,
  ArrowRight,
  Flame,
  MessageCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';
import {
  fetchAnalyticsAiPerformance,
  fetchAnalyticsConversationMetrics,
  fetchAnalyticsFunnel,
  fetchAnalyticsOverview,
  fetchConversations,
  type LeadStage,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

function toPercent(value: number): string {
  return `%${Math.round(value * 100)}`;
}

function stageBadge(stage: LeadStage) {
  if (stage === 'hot') {
    return <StatusBadge tone="hot" label="hot lead" />;
  }
  if (stage === 'qualified') {
    return <StatusBadge tone="qualified" label="qualified" />;
  }
  if (stage === 'support') {
    return <StatusBadge tone="support" label="support" />;
  }
  if (stage === 'lost') {
    return <StatusBadge tone="lost" label="lost" />;
  }
  return <StatusBadge tone="new" label="new" />;
}

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return 'unknown';
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} saat`;
  }

  const days = Math.floor(hours / 24);
  return `${days} gun`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const overviewQuery = useApiQuery(fetchAnalyticsOverview);
  const funnelQuery = useApiQuery(fetchAnalyticsFunnel);
  const conversationMetricsQuery = useApiQuery(fetchAnalyticsConversationMetrics);
  const aiQuery = useApiQuery(fetchAnalyticsAiPerformance);
  const conversationsQuery = useApiQuery(fetchConversations);

  const isLoading =
    overviewQuery.isLoading ||
    funnelQuery.isLoading ||
    conversationMetricsQuery.isLoading ||
    aiQuery.isLoading ||
    conversationsQuery.isLoading;

  const error =
    overviewQuery.error ??
    funnelQuery.error ??
    conversationMetricsQuery.error ??
    aiQuery.error ??
    conversationsQuery.error;

  const refreshAll = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      funnelQuery.refetch(),
      conversationMetricsQuery.refetch(),
      aiQuery.refetch(),
      conversationsQuery.refetch(),
    ]);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1500px] p-6 md:p-8">
          <LoadingState
            title="Dashboard yukleniyor"
            description="Analytics ve conversation verileri backend'den cekiliyor."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1500px] p-6 md:p-8">
          <ErrorState
            title="Dashboard verisi alinamadi"
            description={error}
            action={
              <button
                onClick={() => {
                  void refreshAll();
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

  const overview = overviewQuery.data!;
  const funnel = funnelQuery.data!;
  const conversationMetrics = conversationMetricsQuery.data!;
  const aiPerformance = aiQuery.data!;
  const conversations = conversationsQuery.data ?? [];

  const topConversations = [...conversations]
    .sort((a, b) => {
      const left = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const right = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return right - left;
    })
    .slice(0, 3);

  const insights = [
    `AI yanit basari orani ${toPercent(aiPerformance.rates.aiReplySuccessRate)} seviyesinde.`,
    `Yeni -> qualified donusumu ${toPercent(funnel.conversionRates.newToQualified)} olarak olculdu.`,
    `Ortalama cevap suresi ${Math.round(conversationMetrics.avgResponseTimeSeconds)} saniye.`,
  ];

  const operationalKpis = [
    {
      id: 'incoming',
      title: 'Total messages',
      value: String(overview.totals.messages),
      helper: `AI rate ${toPercent(overview.rates.aiResponseRate)}`,
      icon: MessageCircle,
    },
    {
      id: 'active',
      title: 'Active conversations',
      value: String(conversationMetrics.activeConversations),
      helper: `Toplam ${conversationMetrics.totalConversations}`,
      icon: Users,
    },
    {
      id: 'ai',
      title: 'AI replies sent',
      value: String(aiPerformance.counts.replySentCount),
      helper: `Decision ${aiPerformance.counts.aiDecisionCount}`,
      icon: Sparkles,
    },
    {
      id: 'handoff',
      title: 'Human takeover count',
      value: String(aiPerformance.counts.handoffStartedCount),
      helper: `Takeover rate ${toPercent(overview.rates.humanTakeoverRate)}`,
      icon: UserRoundCheck,
    },
  ];

  const salesKpis = [
    {
      id: 'qualified',
      label: 'Qualified leads',
      value: String(funnel.stages.qualified),
    },
    { id: 'hot', label: 'Hot leads', value: String(funnel.stages.hot) },
    {
      id: 'conversion',
      label: 'Conversion to hot',
      value: toPercent(overview.rates.conversionToHotRate),
    },
    {
      id: 'closed',
      label: 'Closed conversations',
      value: String(funnel.stages.closed),
    },
  ];

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
            {
              id: 'refresh',
              label: 'Yenile',
              variant: 'secondary',
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => {
                void refreshAll();
              },
            },
          ]}
        />

        <section className="mb-6 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-primary/10 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">Canli operasyon sinyali</p>
              <p className="text-sm text-muted-foreground">
                Son uretim zamani: {new Date(overview.generatedAt).toLocaleString('tr-TR')}
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
              <article key={kpi.id} className="rounded-xl border border-border bg-card/60 p-5">
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
                <div key={kpi.id} className="rounded-lg border border-border bg-secondary/40 p-4">
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
                Hot lead sayisi: {funnel.stages.hot}. Oncelikli takip listesine ekle.
              </li>
              <li className="rounded-lg border border-border bg-secondary/30 p-3">
                Handoff frekansi: {toPercent(aiPerformance.rates.handoffFrequency)}.
              </li>
              <li className="rounded-lg border border-border bg-secondary/30 p-3">
                Ortalama mesaj/conversation: {conversationMetrics.avgMessagesPerConversation.toFixed(2)}.
              </li>
            </ul>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-xl border border-border bg-card/60 p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Canli konusmalar</h2>
              <Link to="/chat" className="text-sm font-semibold text-primary hover:underline">
                Tumunu ac
              </Link>
            </div>
            {topConversations.length === 0 ? (
              <EmptyState
                title="Aktif konusma yok"
                description="Yeni mesaj geldigi anda buradan canli konusma listesine ulasabilirsin."
              />
            ) : (
              <div className="space-y-3">
                {topConversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-lg border border-border bg-secondary/35 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold">{conversation.phoneNumber}</p>
                      <div className="flex items-center gap-2">
                        {stageBadge(conversation.leadStage)}
                        {modeBadge(conversation.aiMode)}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Conversation ID: {conversation.id}
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
              {insights.map((insight) => (
                <div key={insight} className="rounded-lg border border-border bg-secondary/35 p-3">
                  <p className="text-xs text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>

            {aiPerformance.rates.aiReplySuccessRate < 0.6 ? (
              <div className="mt-4 rounded-lg border border-red-500/35 bg-red-500/10 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-300" />
                  <p className="text-sm font-semibold text-red-200">Risk alarmi</p>
                </div>
                <p className="text-xs text-red-100/90">
                  AI reply success rate dusuk. Live Chat panelinde manual takip onerilir.
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2">
              <Flame className="h-4 w-4 text-orange-200" />
              <p className="text-xs text-orange-100">
                Hot lead kapanis hedefi: bugun en az {Math.max(1, Math.floor(funnel.stages.hot / 3))} temsilci takip aksiyonu.
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function modeBadge(mode: 'auto_reply' | 'suggest_only' | 'paused') {
  if (mode === 'paused') {
    return <StatusBadge tone="paused" label="paused" />;
  }
  if (mode === 'suggest_only') {
    return <StatusBadge tone="handoff" label="suggest" />;
  }
  return <StatusBadge tone="active" label="auto" />;
}
