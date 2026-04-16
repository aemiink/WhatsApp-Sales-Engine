import { useState } from 'react';
import {
  CirclePlay,
  GitBranch,
  Hand,
  MessageSquareMore,
  Save,
  Sparkles,
  Target,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';

type NodeType = 'start' | 'message' | 'condition' | 'ai' | 'handoff' | 'goal';

interface FlowNode {
  id: string;
  type: NodeType;
  title: string;
  detail: string;
}

const nodes: FlowNode[] = [
  {
    id: 'n1',
    type: 'start',
    title: 'Start node',
    detail: 'Yeni mesaj geldiginde akisi baslat',
  },
  {
    id: 'n2',
    type: 'ai',
    title: 'Intent detection',
    detail: 'Musteri amacini ve lead asamasini cikar',
  },
  {
    id: 'n3',
    type: 'condition',
    title: 'Condition: hot lead?',
    detail: 'Evet ise hizli teklif + randevu aksiyonuna gec',
  },
  {
    id: 'n4',
    type: 'handoff',
    title: 'Human handoff',
    detail: 'Teknik veya kriz durumunda temsilci devral',
  },
  {
    id: 'n5',
    type: 'goal',
    title: 'Goal: demo booked',
    detail: 'Kapanis hedefi: demo randevusu',
  },
];

const nodeTypeMeta: Record<NodeType, { label: string; icon: typeof CirclePlay; className: string }> = {
  start: {
    label: 'Start',
    icon: CirclePlay,
    className: 'border-primary/45 bg-primary/10 text-primary',
  },
  message: {
    label: 'Message',
    icon: MessageSquareMore,
    className: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
  },
  condition: {
    label: 'Condition',
    icon: GitBranch,
    className: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
  },
  ai: {
    label: 'AI',
    icon: Sparkles,
    className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  },
  handoff: {
    label: 'Handoff',
    icon: Hand,
    className: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  },
  goal: {
    label: 'Goal',
    icon: Target,
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  },
};

export function AutomationBuilder() {
  const [selected, setSelected] = useState<FlowNode>(nodes[0]);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1600px] p-6 md:p-8">
        <PageHeader
          title="Automation Builder"
          description="Node tiplerini net ayir, karmasikligi azalt, operasyon ekibi icin okunur akislar olustur."
          badge="MVP flow view"
          actions={[
            {
              id: 'save',
              label: 'Akisi kaydet',
              variant: 'primary',
              icon: <Save className="h-4 w-4" />,
            },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="rounded-xl border border-border bg-card/60 p-4">
            <h2 className="mb-3 text-lg font-bold">Node tipleri</h2>
            <div className="space-y-2">
              {(Object.keys(nodeTypeMeta) as NodeType[]).map((type) => {
                const meta = nodeTypeMeta[type];
                return (
                  <div
                    key={type}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${meta.className}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <meta.icon className="h-4 w-4" />
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="rounded-xl border border-border bg-card/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Flow canvas</h2>
              <div className="flex gap-2">
                <button className="rounded border border-border bg-secondary/45 p-2 hover:bg-secondary/60">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="rounded border border-border bg-secondary/45 p-2 hover:bg-secondary/60">
                  <ZoomOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-gradient-to-b from-background to-[#0b0b12] p-4">
              {nodes.map((node, index) => {
                const meta = nodeTypeMeta[node.type];
                return (
                  <div key={node.id}>
                    <button
                      onClick={() => setSelected(node)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${meta.className} ${
                        selected.id === node.id ? 'ring-2 ring-primary/40' : ''
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-semibold">{node.title}</p>
                        <span className="text-[11px] uppercase tracking-wide">
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{node.detail}</p>
                    </button>
                    {index < nodes.length - 1 ? (
                      <div className="mx-auto h-4 w-px bg-primary/40"></div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="rounded-xl border border-border bg-card/60 p-4">
            <h2 className="mb-3 text-lg font-bold">Node detay</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Secili node</p>
                <p className="text-sm font-semibold">{selected.title}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-xs text-muted-foreground">Aksiyon notu</p>
                <p className="text-sm">{selected.detail}</p>
              </div>
              <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Design guideline</p>
                <p className="text-sm">
                  Baslangic node her zaman akisin en ustunde ve gorunur olmalidir.
                </p>
              </div>
              <button className="w-full rounded-lg border border-border bg-secondary/45 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60">
                Node ayarlarini duzenle
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
