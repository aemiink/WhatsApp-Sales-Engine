import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  MessageCircleWarning,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorState, LoadingState } from '../components/shared/PageStates';
import {
  fetchAnalyticsAiPerformance,
  fetchAnalyticsConversationMetrics,
  fetchAnalyticsEvents,
  fetchAnalyticsFunnel,
  fetchAnalyticsOverview,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';
import { useAuth } from '../lib/auth/AuthContext';

function toPercent(value: number): string {
  return `%${Math.round(value * 100)}`;
}

interface TrendPoint {
  day: string;
  messageReceived: number;
  replySent: number;
  handoffStarted: number;
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildTrendData(events: Array<{ type: string; createdAt: string }>): TrendPoint[] {
  const today = new Date();
  const map = new Map<string, TrendPoint>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const key = toDayKey(date);
    map.set(key, {
      day: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
      messageReceived: 0,
      replySent: 0,
      handoffStarted: 0,
    });
  }

  for (const event of events) {
    const key = toDayKey(new Date(event.createdAt));
    const item = map.get(key);
    if (!item) {
      continue;
    }

    if (event.type === 'message_received') {
      item.messageReceived += 1;
      continue;
    }

    if (event.type === 'reply_sent') {
      item.replySent += 1;
      continue;
    }

    if (event.type === 'handoff_started') {
      item.handoffStarted += 1;
    }
  }

  return [...map.values()];
}

export function Analytics() {
  const { workspace } = useAuth();
  const overviewQuery = useApiQuery(fetchAnalyticsOverview, []);
  const funnelQuery = useApiQuery(fetchAnalyticsFunnel, []);
  const conversationMetricsQuery = useApiQuery(fetchAnalyticsConversationMetrics, []);
  const aiQuery = useApiQuery(fetchAnalyticsAiPerformance, []);
  const eventsQuery = useApiQuery(
    () => {
      if (!workspace?.id) {
        return Promise.resolve([]);
      }

      return fetchAnalyticsEvents(workspace.id);
    },
    [workspace?.id],
  );

  const isLoading =
    overviewQuery.isLoading ||
    funnelQuery.isLoading ||
    conversationMetricsQuery.isLoading ||
    aiQuery.isLoading ||
    eventsQuery.isLoading;

  const error =
    overviewQuery.error ??
    funnelQuery.error ??
    conversationMetricsQuery.error ??
    aiQuery.error ??
    eventsQuery.error;

  const refreshAll = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      funnelQuery.refetch(),
      conversationMetricsQuery.refetch(),
      aiQuery.refetch(),
      eventsQuery.refetch(),
    ]);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1500px] p-6 md:p-8">
          <LoadingState
            title="Analytics yukleniyor"
            description="Overview, funnel ve AI metrikleri backend'den cekiliyor."
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
            title="Analytics verisi alinamadi"
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
  const ai = aiQuery.data!;
  const events = eventsQuery.data ?? [];

  const overviewTrend = buildTrendData(events);

  const aiMetrics = [
    {
      id: 'autonomous',
      label: 'AI ile basariyla yonetilen cevaplar',
      value: toPercent(ai.rates.aiReplySuccessRate),
      helper: `Reply sent: ${ai.counts.replySentCount}`,
    },
    {
      id: 'handoff',
      label: 'Handoff frekansi',
      value: toPercent(ai.rates.handoffFrequency),
      helper: `Handoff count: ${ai.counts.handoffStartedCount}`,
    },
    {
      id: 'response',
      label: 'Ortalama cevap suresi',
      value: `${Math.round(conversationMetrics.avgResponseTimeSeconds)} sn`,
      helper: `Toplam mesaj: ${conversationMetrics.totalMessages}`,
    },
  ];

  const conversationInsights = [
    `AI decision sayisi: ${ai.counts.aiDecisionCount}`,
    `Yeni -> Qualified donusumu: ${toPercent(funnel.conversionRates.newToQualified)}`,
    `Qualified -> Hot donusumu: ${toPercent(funnel.conversionRates.qualifiedToHot)}`,
  ];

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1500px] p-6 md:p-8">
        <PageHeader
          title="Analytics"
          description="Veriyi hizli anla: once genel gorunum, sonra funnel, AI performansi ve konusma icgoruleri."
          badge="Gercek zamanli veri"
          helpKey="analytics"
          actions={[
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

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Total messages</p>
            <p className="mt-1 text-3xl font-bold">{overview.totals.messages}</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Active conversations</p>
            <p className="mt-1 text-3xl font-bold">{conversationMetrics.activeConversations}</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Qualified leads</p>
            <p className="mt-1 text-3xl font-bold">{funnel.stages.qualified}</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Conversion to hot</p>
            <p className="mt-1 text-3xl font-bold">
              {toPercent(overview.rates.conversionToHotRate)}
            </p>
          </article>
        </section>

        <section className="mb-6 rounded-xl border border-border bg-card/60 p-5">
          <div className="mb-3">
            <h2 className="text-xl font-bold">Overview trend</h2>
            <p className="text-sm text-muted-foreground">
              Son 7 gunde message_received, reply_sent ve handoff_started event dagilimi.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={overviewTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,255,0,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 15, 25, 0.95)',
                  border: '1px solid rgba(163, 255, 0, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="messageReceived"
                stroke="#A3FF00"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="replySent"
                stroke="#00d9ff"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="handoffStarted"
                stroke="#ff9d4d"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="mb-6 rounded-xl border border-border bg-card/60 p-5">
          <h2 className="text-xl font-bold">Funnel</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Her asamadaki kayiplari ve hacmi tek satirda gor.
          </p>
          <div className="space-y-3">
            {[
              {
                stage: 'New',
                count: funnel.stages.new,
                ratio: 100,
              },
              {
                stage: 'Qualified',
                count: funnel.stages.qualified,
                ratio: Math.round(funnel.conversionRates.newToQualified * 100),
              },
              {
                stage: 'Hot',
                count: funnel.stages.hot,
                ratio: Math.round(funnel.conversionRates.qualifiedToHot * 100),
              },
              {
                stage: 'Closed',
                count: funnel.stages.closed,
                ratio: Math.round(funnel.conversionRates.hotToClosed * 100),
              },
            ].map((item) => (
              <div key={item.stage} className="rounded-lg border border-border bg-secondary/35 p-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <p className="font-semibold">{item.stage}</p>
                  <p className="text-muted-foreground">
                    {item.count} • %{item.ratio}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.ratio}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">AI performance</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {aiMetrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-lg border border-border bg-secondary/35 p-4"
              >
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="my-1 text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.helper}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Conversation insights</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {conversationInsights.map((insight) => (
                <li key={insight} className="rounded-lg border border-border bg-secondary/35 p-3">
                  {insight}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-red-500/35 bg-red-500/10 p-5">
            <div className="mb-2 flex items-center gap-2">
              <MessageCircleWarning className="h-5 w-5 text-red-300" />
              <h2 className="text-xl font-bold text-red-200">Kritik uyarilar</h2>
            </div>
            <ul className="space-y-2 text-sm text-red-100/90">
              <li className="rounded-lg border border-red-500/35 bg-red-500/15 p-3">
                Handoff rate: {toPercent(overview.rates.humanTakeoverRate)}
              </li>
              <li className="rounded-lg border border-red-500/35 bg-red-500/15 p-3">
                Drop-off qualified -&gt; hot:{' '}
                {toPercent(funnel.dropOffRates.qualifiedToHot)}
              </li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
