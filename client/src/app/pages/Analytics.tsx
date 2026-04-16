import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, MessageCircleWarning, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';

const overviewTrend = [
  { day: 'Pzt', conversion: 21, aiRate: 78 },
  { day: 'Sal', conversion: 23, aiRate: 80 },
  { day: 'Car', conversion: 22, aiRate: 82 },
  { day: 'Per', conversion: 25, aiRate: 84 },
  { day: 'Cum', conversion: 27, aiRate: 86 },
  { day: 'Cmt', conversion: 24, aiRate: 83 },
  { day: 'Paz', conversion: 26, aiRate: 85 },
];

const funnel = [
  { stage: 'Incoming', count: 412, ratio: 100 },
  { stage: 'Qualified', count: 236, ratio: 57 },
  { stage: 'Hot', count: 97, ratio: 24 },
  { stage: 'Offer', count: 62, ratio: 15 },
  { stage: 'Won', count: 41, ratio: 10 },
];

const aiMetrics = [
  {
    id: 'autonomous',
    label: 'AI ile basariyla yonetilen konusmalar',
    value: '%85',
    helper: 'Gecen haftaya gore +4 puan',
  },
  {
    id: 'handoff',
    label: 'Handoff oranı',
    value: '%12',
    helper: 'Kritik teknik gorusmelerde yogunlasiyor',
  },
  {
    id: 'response',
    label: 'Ortalama cevap suresi',
    value: '1.9 sn',
    helper: 'Hedef aralikta',
  },
];

const conversationInsights = [
  'Fiyat itirazlarinda demo + ROI yaniti verilen konusmalarin kazanma orani %18 daha yuksek.',
  'Aksam 16:00-20:00 araligi lead kalite skorunda en guclu saat dilimi.',
  'Teknik soru gelen konusmalarda handoff gecikirse kapanis olasiligi belirgin dusuyor.',
];

export function Analytics() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1500px] p-6 md:p-8">
        <PageHeader
          title="Analytics"
          description="Veriyi hizli anla: once genel gorunum, sonra funnel, AI performansi ve konusma icgoruleri."
          badge="Ajans ve operasyon gorunumu"
        />

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Incoming messages today</p>
            <p className="mt-1 text-3xl font-bold">412</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Active conversations</p>
            <p className="mt-1 text-3xl font-bold">39</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Qualified leads</p>
            <p className="mt-1 text-3xl font-bold">236</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-xs text-muted-foreground">Conversion rate</p>
            <p className="mt-1 text-3xl font-bold">%26</p>
          </article>
        </section>

        <section className="mb-6 rounded-xl border border-border bg-card/60 p-5">
          <div className="mb-3">
            <h2 className="text-xl font-bold">Overview trend</h2>
            <p className="text-sm text-muted-foreground">
              Donusum ve AI yonetim performansi birlikte artiyor.
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
                dataKey="conversion"
                stroke="#A3FF00"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="aiRate"
                stroke="#00d9ff"
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
            {funnel.map((item) => (
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
                Teknik gorusmelerde ortalama cevap suresi hedefin uzerine cikiyor.
              </li>
              <li className="rounded-lg border border-red-500/35 bg-red-500/15 p-3">
                4 hot lead son 30 dakikada insan takibi bekliyor.
              </li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
