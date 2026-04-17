import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquareText,
  NotebookPen,
  RefreshCw,
  Search,
  UserRoundPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';
import {
  fetchConversationDetail,
  fetchConversations,
  type AiMode,
  type ConversationDetail,
  type ConversationListItem,
  type LeadStage,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

type FilterKey = 'all' | 'new' | 'qualified' | 'hot' | 'lost' | 'support' | 'paused';

const filterOptions: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tum leads' },
  { key: 'new', label: 'new' },
  { key: 'qualified', label: 'qualified' },
  { key: 'hot', label: 'hot' },
  { key: 'lost', label: 'lost' },
  { key: 'support', label: 'support' },
  { key: 'paused', label: 'ai paused' },
];

function stageToBadge(stage: LeadStage) {
  if (stage === 'new') {
    return <StatusBadge tone="new" label="new" />;
  }
  if (stage === 'qualified') {
    return <StatusBadge tone="qualified" label="qualified" />;
  }
  if (stage === 'hot') {
    return <StatusBadge tone="hot" label="hot" />;
  }
  if (stage === 'support') {
    return <StatusBadge tone="support" label="support" />;
  }
  return <StatusBadge tone="lost" label="lost" />;
}

function modeBadge(mode: AiMode) {
  if (mode === 'paused') {
    return <StatusBadge tone="paused" label="paused" />;
  }
  if (mode === 'suggest_only') {
    return <StatusBadge tone="handoff" label="suggest" />;
  }
  return <StatusBadge tone="active" label="auto" />;
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

function scoreFromStage(stage: LeadStage, mode: AiMode): number {
  const baseMap: Record<LeadStage, number> = {
    new: 45,
    qualified: 72,
    hot: 92,
    support: 58,
    lost: 20,
  };

  const modeBoost = mode === 'auto_reply' ? 4 : mode === 'paused' ? -6 : 0;
  return Math.max(0, Math.min(100, baseMap[stage] + modeBoost));
}

function nextActionFromLead(lead: ConversationListItem): string {
  if (lead.leadStage === 'hot') {
    return 'Demo randevusu netlestir';
  }
  if (lead.leadStage === 'qualified') {
    return 'Fiyat/teklif takibi';
  }
  if (lead.leadStage === 'support') {
    return 'Temsilciye teknik devir';
  }
  if (lead.leadStage === 'lost') {
    return 'Re-engage akisi planla';
  }
  return 'Ihtiyac analizi baslat';
}

function latestMessage(detail: ConversationDetail | null): string {
  if (!detail || detail.messages.length === 0) {
    return 'Mesaj gecmisi bulunmuyor.';
  }

  const last = detail.messages[detail.messages.length - 1];
  return last.content ?? 'Icerik yok.';
}

export function LeadManagement() {
  const navigate = useNavigate();
  const conversationsQuery = useApiQuery(fetchConversations, []);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [detailsById, setDetailsById] = useState<Record<string, ConversationDetail>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const leads = conversationsQuery.data ?? [];

  useEffect(() => {
    if (leads.length === 0) {
      return;
    }

    if (!selectedLeadId || !leads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedLeadId || detailsById[selectedLeadId]) {
        return;
      }

      setDetailLoading(true);
      setDetailError(null);
      try {
        const detail = await fetchConversationDetail(selectedLeadId);
        setDetailsById((prev) => ({
          ...prev,
          [selectedLeadId]: detail,
        }));
      } catch (error: unknown) {
        setDetailError(error instanceof Error ? error.message : 'Lead detayi alinamadi.');
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedLeadId, detailsById]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const queryValue = query.trim();
      const queryMatch =
        queryValue.length === 0 ||
        lead.phoneNumber.toLowerCase().includes(queryValue.toLowerCase()) ||
        lead.id.toLowerCase().includes(queryValue.toLowerCase());

      if (!queryMatch) {
        return false;
      }

      if (activeFilter === 'all') {
        return true;
      }
      if (activeFilter === 'paused') {
        return lead.aiMode === 'paused';
      }
      return lead.leadStage === activeFilter;
    });
  }, [leads, activeFilter, query]);

  const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedDetail = selectedLeadId ? detailsById[selectedLeadId] ?? null : null;

  if (conversationsQuery.isLoading) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1600px] p-6 md:p-8">
          <LoadingState
            title="Lead listesi yukleniyor"
            description="Conversation verileri backend'den aliniyor."
          />
        </div>
      </div>
    );
  }

  if (conversationsQuery.error) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1600px] p-6 md:p-8">
          <ErrorState
            title="Lead listesi alinamadi"
            description={conversationsQuery.error}
            action={
              <button
                onClick={() => {
                  void conversationsQuery.refetch();
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

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1600px] p-6 md:p-8">
        <PageHeader
          title="Lead Management"
          description="Lead tablosunu sade tut, filtrelerle hizli karar al, satir aksiyonlariyla operasyonu hizlandir."
          badge="Mini CRM"
          helpKey="lead-management"
          actions={[
            {
              id: 'add',
              label: 'Yeni lead ekle',
              variant: 'primary',
              icon: <UserRoundPlus className="h-4 w-4" />,
            },
            {
              id: 'refresh',
              label: 'Yenile',
              variant: 'secondary',
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => {
                void conversationsQuery.refetch();
              },
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
                placeholder="Telefon veya id ara"
                className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-border bg-card/60 p-4">
            <div className="mb-3 grid grid-cols-[1.5fr_1fr_0.8fr_1fr_1fr] gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                    className={`grid cursor-pointer grid-cols-[1.5fr_1fr_0.8fr_1fr_1fr] gap-2 rounded-lg border p-3 transition-all ${
                      selectedLeadId === lead.id
                        ? 'border-primary/45 bg-primary/10'
                        : 'border-border bg-secondary/35 hover:bg-secondary/55'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{lead.phoneNumber}</p>
                      <p className="truncate text-xs text-muted-foreground">{lead.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Guncelleme: {formatRelativeTime(lead.lastMessageAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {stageToBadge(lead.leadStage)}
                      {modeBadge(lead.aiMode)}
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm font-semibold">
                        {scoreFromStage(lead.leadStage, lead.aiMode)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{nextActionFromLead(lead)}</p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate('/chat');
                        }}
                        className="rounded border border-border bg-secondary/45 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Sohbeti ac
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
                  <p className="text-sm font-semibold">{selectedLead.phoneNumber}</p>
                  <p className="text-xs text-muted-foreground">{selectedLead.id}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stageToBadge(selectedLead.leadStage)}
                    {modeBadge(selectedLead.aiMode)}
                  </div>
                </div>

                {detailLoading ? (
                  <LoadingState
                    title="Lead detayi yukleniyor"
                    description="Secili konusmanin son mesajlari aliniyor."
                  />
                ) : detailError ? (
                  <ErrorState
                    title="Lead detayi alinamadi"
                    description={detailError}
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-secondary/35 p-3 text-sm">
                    <p className="mb-1 text-xs text-muted-foreground">Operasyon notu</p>
                    <p>{latestMessage(selectedDetail)}</p>
                  </div>
                )}

                <div className="rounded-lg border border-border bg-secondary/35 p-3 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">Atanan temsilci</p>
                  <p>{selectedLead.aiMode === 'paused' ? 'Human agent' : 'AI operator'}</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/chat')}
                    className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-black hover:bg-primary/90"
                  >
                    Sohbeti ac
                  </button>
                  <button className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/60">
                    Aktivite gecmisi
                  </button>
                </div>

                <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    AI onerisi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sonraki adim: {nextActionFromLead(selectedLead)}
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
