import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarPlus2,
  CheckCheck,
  Clock3,
  PauseCircle,
  PlayCircle,
  Search,
  Send,
  UserCircle2,
  UserRoundCog,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';
import {
  endConversationHandoff,
  fetchConversationDetail,
  fetchConversations,
  requestSalesDecisionPreview,
  sendManualMessage,
  startConversationHandoff,
  updateConversationAiMode,
  type AiMode,
  type ConversationDetail,
  type ConversationMessage,
  type LeadStage,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

type ConversationFilter = 'all' | 'hot' | 'paused' | 'support';

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

function formatClock(value: string): string {
  return new Date(value).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
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

function modeBadge(mode: AiMode) {
  if (mode === 'paused') {
    return <StatusBadge tone="paused" label="ai paused" />;
  }
  if (mode === 'suggest_only') {
    return <StatusBadge tone="handoff" label="suggest only" />;
  }
  return <StatusBadge tone="active" label="auto reply" />;
}

function filterLabel(filter: ConversationFilter): string {
  if (filter === 'hot') {
    return 'Hot lead';
  }
  if (filter === 'paused') {
    return 'AI paused';
  }
  if (filter === 'support') {
    return 'Support';
  }
  return 'Tum konusmalar';
}

function classifyMessageRole(message: ConversationMessage): 'customer' | 'ai' | 'human' {
  if (message.direction === 'inbound') {
    return 'customer';
  }

  if (message.senderType === 'ai') {
    return 'ai';
  }

  return 'human';
}

function latestMessageContent(detail: ConversationDetail | null): string {
  if (!detail || detail.messages.length === 0) {
    return 'Mesaj gecmisi henuz yok.';
  }

  const last = detail.messages[detail.messages.length - 1];
  return last.content ?? 'Icerik bulunamadi.';
}

export function LiveChat() {
  const conversationsQuery = useApiQuery(fetchConversations);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [searchValue, setSearchValue] = useState('');
  const [detailsById, setDetailsById] = useState<Record<string, ConversationDetail>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Record<string, unknown> | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );

  useEffect(() => {
    if (conversations.length === 0) {
      return;
    }

    if (!selectedId || !conversations.some((item) => item.id === selectedId)) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const loadConversationDetail = useCallback(
    async (conversationId: string, force = false) => {
      if (!force && detailsById[conversationId]) {
        return;
      }

      setDetailLoading(true);
      setDetailError(null);
      try {
        const detail = await fetchConversationDetail(conversationId);
        setDetailsById((prev) => ({
          ...prev,
          [conversationId]: detail,
        }));
      } catch (error: unknown) {
        setDetailError(error instanceof Error ? error.message : 'Conversation detail alinamadi.');
      } finally {
        setDetailLoading(false);
      }
    },
    [detailsById],
  );

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    void loadConversationDetail(selectedId);
  }, [selectedId, loadConversationDetail]);

  const selectedConversation =
    conversations.find((item) => item.id === selectedId) ?? null;
  const selectedDetail = selectedId ? detailsById[selectedId] ?? null : null;

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const searchMatch = conversation.phoneNumber.includes(searchValue);
      if (!searchMatch && searchValue.trim().length > 0) {
        return false;
      }

      if (activeFilter === 'hot') {
        return conversation.leadStage === 'hot';
      }
      if (activeFilter === 'paused') {
        return conversation.aiMode === 'paused';
      }
      if (activeFilter === 'support') {
        return conversation.leadStage === 'support';
      }

      return true;
    });
  }, [conversations, activeFilter, searchValue]);

  const refreshSelectedConversation = useCallback(async () => {
    if (!selectedId) {
      return;
    }

    await loadConversationDetail(selectedId, true);
  }, [selectedId, loadConversationDetail]);

  const runAction = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      setPendingAction(key);
      setActionError(null);
      try {
        await fn();
        await Promise.all([
          conversationsQuery.refetch(),
          refreshSelectedConversation(),
        ]);
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Aksiyon basarisiz.');
      } finally {
        setPendingAction(null);
      }
    },
    [conversationsQuery, refreshSelectedConversation],
  );

  const onManualSend = async () => {
    const text = messageInput.trim();
    if (!selectedId || text.length === 0) {
      return;
    }

    await runAction('manual-send', async () => {
      await sendManualMessage(selectedId, text);
      setMessageInput('');
    });
  };

  const setMode = async (mode: AiMode) => {
    if (!selectedId) {
      return;
    }

    await runAction(`mode-${mode}`, async () => {
      await updateConversationAiMode(selectedId, mode);
    });
  };

  const startHandoff = async () => {
    if (!selectedId) {
      return;
    }

    await runAction('handoff-start', async () => {
      await startConversationHandoff(selectedId, 'manual_panel');
    });
  };

  const endHandoff = async () => {
    if (!selectedId) {
      return;
    }

    await runAction('handoff-end', async () => {
      await endConversationHandoff(selectedId, 'auto_reply');
    });
  };

  useEffect(() => {
    const runDecisionPreview = async () => {
      if (!selectedDetail || selectedDetail.messages.length === 0) {
        setDecision(null);
        return;
      }

      const targetMessage = [...selectedDetail.messages]
        .reverse()
        .find((message) => message.direction === 'inbound');

      if (!targetMessage) {
        setDecision(null);
        return;
      }

      setDecisionLoading(true);
      try {
        const data = await requestSalesDecisionPreview({
          conversationId: selectedDetail.id,
          messageId: targetMessage.id,
        });
        setDecision(data);
      } catch {
        setDecision(null);
      } finally {
        setDecisionLoading(false);
      }
    };

    void runDecisionPreview();
  }, [selectedDetail]);

  const detailMessages = selectedDetail?.messages ?? [];

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1750px] p-5 md:p-6">
        <PageHeader
          title="Live Chat Cockpit"
          description="Konusma durumu, AI ongorusu ve kritik aksiyonlar tek ekranda."
          badge="Canli operasyon paneli"
          helpKey="live-chat"
        />

        {actionError ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="rounded-xl border border-border bg-card/60">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-bold">Conversations</h2>
              <p className="text-xs text-muted-foreground">
                Durumu bir bakista gor, hizli filtrele.
              </p>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Telefon ara"
                  className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-b border-border p-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'hot', 'paused', 'support'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      activeFilter === filter
                        ? 'border-primary/40 bg-primary/15 text-primary'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {filterLabel(filter)}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[68vh] space-y-2 overflow-auto p-3">
              {conversationsQuery.isLoading ? (
                <LoadingState
                  title="Konusmalar yukleniyor"
                  description="Canli konusma listesi backend'den cekiliyor."
                />
              ) : conversationsQuery.error ? (
                <ErrorState
                  title="Konusmalar alinamadi"
                  description={conversationsQuery.error}
                  action={
                    <button
                      onClick={() => {
                        void conversationsQuery.refetch();
                      }}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-black"
                    >
                      Tekrar dene
                    </button>
                  }
                />
              ) : filteredConversations.length === 0 ? (
                <EmptyState
                  title="Filtreye uygun konusma yok"
                  description="Filtreyi temizleyerek tum aktif konusmalari tekrar gorebilirsin."
                />
              ) : (
                filteredConversations.map((conversation) => {
                  const detail = detailsById[conversation.id] ?? null;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedId === conversation.id
                          ? 'border-primary/45 bg-primary/10'
                          : 'border-border bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{conversation.phoneNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.id.slice(0, 8)}...
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </p>
                      </div>

                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {stageBadge(conversation.leadStage)}
                        {modeBadge(conversation.aiMode)}
                      </div>

                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {latestMessageContent(detail)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="rounded-xl border border-border bg-card/60">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
              <div>
                <h2 className="text-lg font-bold">
                  {selectedConversation?.phoneNumber ?? 'Konusma secilmedi'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation
                    ? `son guncelleme ${formatRelativeTime(selectedConversation.lastMessageAt)}`
                    : 'Liste panelinden bir konusma sec'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedConversation ? stageBadge(selectedConversation.leadStage) : null}
                {selectedConversation ? modeBadge(selectedConversation.aiMode) : null}
              </div>
            </header>

            <div className="min-h-[58vh] space-y-4 bg-gradient-to-b from-background to-[#09090f] p-5">
              {detailLoading && !selectedDetail ? (
                <LoadingState
                  title="Mesajlar yukleniyor"
                  description="Secili konusmanin mesaj gecmisi aliniyor."
                />
              ) : detailError ? (
                <ErrorState
                  title="Mesajlar alinamadi"
                  description={detailError}
                  action={
                    <button
                      onClick={() => {
                        void refreshSelectedConversation();
                      }}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-black"
                    >
                      Tekrar dene
                    </button>
                  }
                />
              ) : detailMessages.length === 0 ? (
                <EmptyState
                  title="Mesaj gecmisi yok"
                  description="Bu konusmada henuz kayitli mesaj bulunmuyor."
                />
              ) : (
                detailMessages.map((message) => {
                  const role = classifyMessageRole(message);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${role === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`flex max-w-[82%] gap-2 ${
                          role === 'customer' ? '' : 'flex-row-reverse text-right'
                        }`}
                      >
                        <div
                          className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border ${
                            role === 'customer'
                              ? 'border-border bg-secondary/70'
                              : role === 'ai'
                                ? 'border-primary/35 bg-primary/15 text-primary'
                                : 'border-cyan-500/35 bg-cyan-500/15 text-cyan-200'
                          }`}
                        >
                          {role === 'customer' ? (
                            <UserCircle2 className="h-4 w-4" />
                          ) : role === 'ai' ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <UserRoundCog className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div
                            className={`rounded-2xl border px-4 py-2.5 text-sm ${
                              role === 'customer'
                                ? 'rounded-tl-sm border-border bg-secondary/70'
                                : role === 'ai'
                                  ? 'rounded-tr-sm border-primary/35 bg-primary/10'
                                  : 'rounded-tr-sm border-cyan-500/35 bg-cyan-500/10'
                            }`}
                          >
                            {message.content ?? 'Icerik bulunamadi.'}
                          </div>
                          <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                            <span>{formatClock(message.createdAt)}</span>
                            {message.direction === 'outbound' ? (
                              <CheckCheck className="h-3.5 w-3.5 text-primary" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="border-t border-border p-4">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Manuel mesaj gonder..."
                  className="min-h-[62px] flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    void onManualSend();
                  }}
                  disabled={!selectedId || messageInput.trim().length === 0 || pendingAction !== null}
                  className="inline-flex h-[62px] items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-black transition-all hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  Gonder
                </button>
              </div>
            </footer>
          </section>

          <aside className="rounded-xl border border-border bg-card/60 p-4">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">AI Brain</p>
              <h2 className="text-lg font-bold">Karar paneli</h2>
            </div>

            {decisionLoading ? (
              <LoadingState
                title="AI karari hazirlaniyor"
                description="Secili konusma icin test decision endpoint'i cagriliyor."
              />
            ) : decision ? (
              <>
                <section className="space-y-2 rounded-lg border border-primary/35 bg-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">Detected intent</p>
                  <p className="text-sm font-semibold text-primary">
                    {typeof decision.intent === 'string' ? decision.intent : 'unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Objection:{' '}
                    {typeof decision.objection === 'string'
                      ? decision.objection
                      : 'none'}
                  </p>
                </section>

                <section className="mt-3 space-y-2 rounded-lg border border-yellow-500/35 bg-yellow-500/10 p-3">
                  <p className="text-xs text-muted-foreground">Lead stage</p>
                  <p className="text-sm font-semibold text-yellow-200">
                    {typeof decision.leadStage === 'string' ? decision.leadStage : 'new'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sonraki ideal aksiyon:{' '}
                    {typeof decision.nextBestAction === 'string'
                      ? decision.nextBestAction
                      : 'belirlenmedi'}
                  </p>
                </section>

                <section className="mt-3 rounded-lg border border-border bg-secondary/35 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Suggested reply</p>
                  <p className="text-sm">
                    {typeof decision.suggestedReply === 'string'
                      ? decision.suggestedReply
                      : 'AI yaniti bulunamadi.'}
                  </p>
                </section>

                <section className="mt-3 rounded-lg border border-border bg-secondary/35 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-sm font-semibold text-primary">
                      {Math.round(
                        (typeof decision.confidence === 'number'
                          ? decision.confidence
                          : 0) * 100,
                      )}
                      %
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.round(
                          (typeof decision.confidence === 'number'
                            ? decision.confidence
                            : 0) * 100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                </section>
              </>
            ) : (
              <EmptyState
                title="AI karari hazir degil"
                description="Karar paneli icin secili konusmada inbound mesaj bulunmasi gerekir."
              />
            )}

            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  void setMode('auto_reply');
                }}
                disabled={!selectedId || pendingAction !== null}
                className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-40"
              >
                AI cevaplasin
              </button>
              <button
                onClick={() => {
                  void startHandoff();
                }}
                disabled={!selectedId || pendingAction !== null}
                className="w-full rounded-lg border border-cyan-500/35 bg-cyan-500/15 px-3 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-40"
              >
                Temsilci devral
              </button>
              <button
                onClick={() => {
                  void setMode(selectedConversation?.aiMode === 'paused' ? 'auto_reply' : 'paused');
                }}
                disabled={!selectedId || pendingAction !== null}
                className="w-full rounded-lg border border-violet-500/35 bg-violet-500/15 px-3 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/25 disabled:opacity-40"
              >
                {selectedConversation?.aiMode === 'paused' ? (
                  <span className="inline-flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    AI resume
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <PauseCircle className="h-4 w-4" />
                    AI pause
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  void endHandoff();
                }}
                disabled={!selectedId || pendingAction !== null}
                className="w-full rounded-lg border border-orange-500/35 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold text-orange-100 hover:bg-orange-500/25 disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarPlus2 className="h-4 w-4" />
                  Handoff bitir + AI resume
                </span>
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
              <p className="mb-1 inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                Operasyon notu
              </p>
              <p>
                Aksiyonlar backend endpointlerine baglidir: manual send, ai mode, handoff start/end.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
