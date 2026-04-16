import { useMemo, useState } from 'react';
import { MessageSquareText, NotebookPen, Search, UserRoundPlus } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';

type LeadStage = 'new' | 'qualified' | 'hot' | 'lost' | 'support';

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  stage: LeadStage;
  handoffActive: boolean;
  owner: string;
  score: number;
  nextAction: string;
  note: string;
  updatedAt: string;
}

const leads: LeadItem[] = [
  {
    id: 'l-1',
    name: 'Ahmet Yilmaz',
    phone: '+90 532 123 45 67',
    stage: 'hot',
    handoffActive: false,
    owner: 'Ceren',
    score: 94,
    nextAction: 'Demo randevusu netlestir',
    note: 'Fiyat itirazina ragmen kapanisa yakin.',
    updatedAt: '3 dk',
  },
  {
    id: 'l-2',
    name: 'Merve Acar',
    phone: '+90 535 111 22 33',
    stage: 'support',
    handoffActive: true,
    owner: 'Baris',
    score: 68,
    nextAction: 'Teknik sorulari temsilci yanitlasin',
    note: 'API entegrasyonu detayini bekliyor.',
    updatedAt: '11 dk',
  },
  {
    id: 'l-3',
    name: 'Zeynep Demir',
    phone: '+90 543 987 65 43',
    stage: 'qualified',
    handoffActive: false,
    owner: 'Nisa',
    score: 80,
    nextAction: 'Yonetici onayi takibi',
    note: 'Bircok ozellikte mutabik, fiyat donusunu bekliyor.',
    updatedAt: '24 dk',
  },
  {
    id: 'l-4',
    name: 'Emre Cakmak',
    phone: '+90 544 612 77 10',
    stage: 'new',
    handoffActive: false,
    owner: 'Atanmadi',
    score: 52,
    nextAction: 'Ilk ihtiyac analizi',
    note: 'Sadece temel bilgi aldi.',
    updatedAt: '42 dk',
  },
  {
    id: 'l-5',
    name: 'Derya Kaan',
    phone: '+90 534 901 66 88',
    stage: 'lost',
    handoffActive: false,
    owner: 'Ceren',
    score: 34,
    nextAction: '30 gun sonra re-engage',
    note: 'Rakip urune gecis yapti.',
    updatedAt: '1 gun',
  },
];

type FilterKey =
  | 'all'
  | 'new'
  | 'qualified'
  | 'hot'
  | 'lost'
  | 'support'
  | 'handoff-active';

const filterOptions: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tum leads' },
  { key: 'new', label: 'new' },
  { key: 'qualified', label: 'qualified' },
  { key: 'hot', label: 'hot' },
  { key: 'lost', label: 'lost' },
  { key: 'support', label: 'support' },
  { key: 'handoff-active', label: 'handoff active' },
];

function stageToBadge(stage: LeadStage) {
  if (stage === 'new') return <StatusBadge tone="new" label="new" />;
  if (stage === 'qualified')
    return <StatusBadge tone="qualified" label="qualified" />;
  if (stage === 'hot') return <StatusBadge tone="hot" label="hot" />;
  if (stage === 'support') return <StatusBadge tone="support" label="support" />;
  return <StatusBadge tone="lost" label="lost" />;
}

export function LeadManagement() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id ?? '');

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const queryMatch =
        lead.name.toLowerCase().includes(query.toLowerCase()) ||
        lead.phone.includes(query);
      if (!queryMatch) {
        return false;
      }

      if (activeFilter === 'all') return true;
      if (activeFilter === 'handoff-active') return lead.handoffActive;
      return lead.stage === activeFilter;
    });
  }, [activeFilter, query]);

  const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1600px] p-6 md:p-8">
        <PageHeader
          title="Lead Management"
          description="Lead tablosunu sade tut, filtrelerle hizli karar al, satir aksiyonlariyla operasyonu hizlandir."
          badge="Mini CRM"
          actions={[
            {
              id: 'add',
              label: 'Yeni lead ekle',
              variant: 'primary',
              icon: <UserRoundPlus className="h-4 w-4" />,
            },
          ]}
        />

        <section className="mb-4 rounded-xl border border-border bg-card/60 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setActiveFilter(option.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === option.key
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Isim veya telefon ara"
                className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-border bg-card/60 p-4">
            <div className="mb-3 grid grid-cols-[1.6fr_1.1fr_0.8fr_1fr_1fr] gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Lead</span>
              <span>Stage</span>
              <span>Score</span>
              <span>Next action</span>
              <span>Hizli aksiyon</span>
            </div>

            {filteredLeads.length === 0 ? (
              <EmptyState
                title="Lead bulunamadi"
                description="Filtre veya arama kriterini degistirerek lead listesini tekrar goruntule."
              />
            ) : (
              <div className="space-y-2">
                {filteredLeads.map((lead) => (
                  <article
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`grid cursor-pointer grid-cols-[1.6fr_1.1fr_0.8fr_1fr_1fr] gap-2 rounded-lg border p-3 transition-all ${
                      selectedLeadId === lead.id
                        ? 'border-primary/45 bg-primary/10'
                        : 'border-border bg-secondary/35 hover:bg-secondary/55'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{lead.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{lead.phone}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Guncelleme: {lead.updatedAt}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {stageToBadge(lead.stage)}
                      {lead.handoffActive ? (
                        <StatusBadge tone="handoff" label="handoff active" />
                      ) : null}
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm font-semibold">{lead.score}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{lead.nextAction}</p>
                    <div className="flex flex-wrap gap-1">
                      <button className="rounded border border-border bg-secondary/45 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        Sohbeti ac
                      </button>
                      <button className="rounded border border-border bg-secondary/45 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        Stage guncelle
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-border bg-card/60 p-4">
            <h2 className="mb-3 text-lg font-bold">Lead detay</h2>
            {!selectedLead ? (
              <EmptyState
                title="Lead secilmedi"
                description="Detay ve hizli aksiyonlar icin listeden bir lead sec."
              />
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-secondary/35 p-3">
                  <p className="text-sm font-semibold">{selectedLead.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLead.phone}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stageToBadge(selectedLead.stage)}
                    {selectedLead.handoffActive ? (
                      <StatusBadge tone="handoff" label="handoff active" />
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/35 p-3 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">Operasyon notu</p>
                  <p>{selectedLead.note}</p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/35 p-3 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">Atanan temsilci</p>
                  <p>{selectedLead.owner}</p>
                </div>

                <div className="space-y-2">
                  <button className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-black hover:bg-primary/90">
                    Sohbeti ac
                  </button>
                  <button className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60">
                    Stage guncelle
                  </button>
                  <button className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60">
                    Not ekle
                  </button>
                  <button className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60">
                    Temsilciye ata
                  </button>
                </div>

                <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    AI onerisi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bu lead icin en iyi sonraki adim: ROI odakli mini demo +
                    yonetici onayi icin pdf ozet gonderimi.
                  </p>
                </div>

                <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/45 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <NotebookPen className="h-3.5 w-3.5" />
                  Aktivite gecmisini gor
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
