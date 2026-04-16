import { useMemo, useState } from 'react';
import {
  Bot,
  CalendarPlus2,
  CheckCheck,
  Clock3,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Search,
  Send,
  UserCircle2,
  UserRoundCog,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/PageStates';
import { StatusBadge } from '../components/shared/StatusBadge';

type ConversationFilter =
  | 'all'
  | 'unread'
  | 'hot'
  | 'handoff'
  | 'paused';

interface Conversation {
  id: number;
  name: string;
  phone: string;
  lastMessage: string;
  unreadCount: number;
  leadStage: 'new' | 'qualified' | 'hot' | 'support';
  handoffActive: boolean;
  aiPaused: boolean;
  updatedAt: string;
}

interface TimelineMessage {
  id: number;
  role: 'customer' | 'ai' | 'human';
  text: string;
  time: string;
  state?: 'sent' | 'delivered' | 'read';
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: 'Ahmet Yilmaz',
    phone: '+90 532 123 45 67',
    lastMessage: 'Business paket icin ROI hesabini gorebilir miyim?',
    unreadCount: 2,
    leadStage: 'hot',
    handoffActive: false,
    aiPaused: false,
    updatedAt: '1 dk',
  },
  {
    id: 2,
    name: 'Zeynep Demir',
    phone: '+90 543 987 65 43',
    lastMessage: 'Yonetici onayi bekliyoruz, yarin donus yapacagim.',
    unreadCount: 0,
    leadStage: 'qualified',
    handoffActive: false,
    aiPaused: true,
    updatedAt: '6 dk',
  },
  {
    id: 3,
    name: 'Merve Acar',
    phone: '+90 535 111 22 33',
    lastMessage: 'Teknik entegrasyon detayini temsilci anlatabilir mi?',
    unreadCount: 1,
    leadStage: 'support',
    handoffActive: true,
    aiPaused: false,
    updatedAt: '9 dk',
  },
];

const timeline: TimelineMessage[] = [
  {
    id: 1,
    role: 'customer',
    text: 'Merhaba, Business paketinde onboarding sureci nasil ilerliyor?',
    time: '14:11',
    state: 'read',
  },
  {
    id: 2,
    role: 'ai',
    text: 'Merhaba! Ortalama 2 is gununde kurulum tamamliyoruz. Ekibinizle birlikte onboarding checklist paylasiyorum.',
    time: '14:12',
    state: 'read',
  },
  {
    id: 3,
    role: 'customer',
    text: 'ROI hesaplamasini da gormek istiyorum.',
    time: '14:13',
    state: 'read',
  },
  {
    id: 4,
    role: 'human',
    text: 'Harika, 15 dakikalik bir gorusmede hem ROI hem de gecis planini paylasabilirim.',
    time: '14:15',
    state: 'delivered',
  },
];

function stageBadge(stage: Conversation['leadStage']) {
  if (stage === 'hot') {
    return <StatusBadge tone="hot" label="hot lead" />;
  }
  if (stage === 'qualified') {
    return <StatusBadge tone="qualified" label="qualified" />;
  }
  if (stage === 'support') {
    return <StatusBadge tone="support" label="support" />;
  }
  return <StatusBadge tone="new" label="new" />;
}

function filterLabel(filter: ConversationFilter): string {
  if (filter === 'unread') return 'Okunmamis';
  if (filter === 'hot') return 'Hot lead';
  if (filter === 'handoff') return 'Handoff';
  if (filter === 'paused') return 'AI paused';
  return 'Tum konusmalar';
}

export function LiveChat() {
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? 0);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [searchValue, setSearchValue] = useState('');
  const [aiPaused, setAiPaused] = useState(false);
  const [humanControl, setHumanControl] = useState(false);

  const selectedConversation = conversations.find((item) => item.id === selectedId);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const searchMatch =
        conversation.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        conversation.phone.includes(searchValue);

      if (!searchMatch) {
        return false;
      }

      if (activeFilter === 'unread') {
        return conversation.unreadCount > 0;
      }
      if (activeFilter === 'hot') {
        return conversation.leadStage === 'hot';
      }
      if (activeFilter === 'handoff') {
        return conversation.handoffActive;
      }
      if (activeFilter === 'paused') {
        return conversation.aiPaused;
      }
      return true;
    });
  }, [activeFilter, searchValue]);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1750px] p-5 md:p-6">
        <PageHeader
          title="Live Chat Cockpit"
          description="Konusma durumu, AI ongorusu ve kritik aksiyonlar tek ekranda."
          badge="Canli operasyon paneli"
          helpKey="live-chat"
        />

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
                  placeholder="Isim veya telefon ara"
                  className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-b border-border p-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'unread', 'hot', 'handoff', 'paused'] as const).map(
                  (filter) => (
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
                  ),
                )}
              </div>
            </div>

            <div className="max-h-[68vh] space-y-2 overflow-auto p-3">
              {filteredConversations.length === 0 ? (
                <EmptyState
                  title="Filtreye uygun konusma yok"
                  description="Filtreyi temizleyerek tum aktif konusmalari tekrar gorebilirsin."
                />
              ) : (
                filteredConversations.map((conversation) => (
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
                        <p className="text-sm font-semibold">{conversation.name}</p>
                        <p className="text-xs text-muted-foreground">{conversation.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {conversation.updatedAt}
                        </p>
                        {conversation.unreadCount > 0 ? (
                          <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-black">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {stageBadge(conversation.leadStage)}
                      {conversation.handoffActive ? (
                        <StatusBadge tone="handoff" label="handoff active" />
                      ) : null}
                      {conversation.aiPaused ? (
                        <StatusBadge tone="paused" label="ai paused" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {conversation.lastMessage}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="rounded-xl border border-border bg-card/60">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
              <div>
                <h2 className="text-lg font-bold">{selectedConversation?.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation?.phone} • son guncelleme{' '}
                  {selectedConversation?.updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedConversation
                  ? stageBadge(selectedConversation.leadStage)
                  : null}
                {humanControl ? (
                  <StatusBadge tone="handoff" label="human control" />
                ) : (
                  <StatusBadge tone="active" label="ai responding" />
                )}
                {aiPaused ? <StatusBadge tone="paused" label="paused" /> : null}
              </div>
            </header>

            <div className="min-h-[58vh] space-y-4 bg-gradient-to-b from-background to-[#09090f] p-5">
              {timeline.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'customer' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`flex max-w-[82%] gap-2 ${
                      message.role === 'customer'
                        ? ''
                        : 'flex-row-reverse text-right'
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border ${
                        message.role === 'customer'
                          ? 'border-border bg-secondary/70'
                          : message.role === 'ai'
                            ? 'border-primary/35 bg-primary/15 text-primary'
                            : 'border-cyan-500/35 bg-cyan-500/15 text-cyan-200'
                      }`}
                    >
                      {message.role === 'customer' ? (
                        <UserCircle2 className="h-4 w-4" />
                      ) : message.role === 'ai' ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <UserRoundCog className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`rounded-2xl border px-4 py-2.5 text-sm ${
                          message.role === 'customer'
                            ? 'rounded-tl-sm border-border bg-secondary/70'
                            : message.role === 'ai'
                              ? 'rounded-tr-sm border-primary/35 bg-primary/10'
                              : 'rounded-tr-sm border-cyan-500/35 bg-cyan-500/10'
                        }`}
                      >
                        {message.text}
                      </div>
                      <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                        <span>{message.time}</span>
                        {message.state ? (
                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-border p-4">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  placeholder="Manuel mesaj gonder..."
                  className="min-h-[62px] flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button className="inline-flex h-[62px] items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-black transition-all hover:bg-primary/90">
                  <Send className="h-4 w-4" />
                  Gonder
                </button>
              </div>
            </footer>
          </section>

          <aside className="rounded-xl border border-border bg-card/60 p-4">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                AI Brain
              </p>
              <h2 className="text-lg font-bold">Karar paneli</h2>
            </div>

            <section className="space-y-2 rounded-lg border border-primary/35 bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Detected intent</p>
              <p className="text-sm font-semibold text-primary">price objection</p>
              <p className="text-xs text-muted-foreground">
                Musteri urunu istiyor ama fiyat algisi yuksek.
              </p>
            </section>

            <section className="mt-3 space-y-2 rounded-lg border border-yellow-500/35 bg-yellow-500/10 p-3">
              <p className="text-xs text-muted-foreground">Lead stage</p>
              <p className="text-sm font-semibold text-yellow-200">hot (close-ready)</p>
              <p className="text-xs text-muted-foreground">
                Sonraki ideal aksiyon: demo zamani almak.
              </p>
            </section>

            <section className="mt-3 rounded-lg border border-border bg-secondary/35 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Suggested reply</p>
              <p className="text-sm">
                "Business pakette ROI hesabini birlikte cikartalim, 15 dakikada netlestirelim."
              </p>
            </section>

            <section className="mt-3 rounded-lg border border-border bg-secondary/35 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm font-semibold text-primary">92%</p>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full w-[92%] rounded-full bg-primary"></div>
              </div>
            </section>

            <details className="mt-4 rounded-lg border border-border bg-secondary/25 p-3">
              <summary className="cursor-pointer text-sm font-semibold">
                Secondary insights
              </summary>
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                <p>Objection: "Fiyat yuksek".</p>
                <p>Next best action: "Demo + ROI ekran paylasimi".</p>
                <p>Risk: 15 dk icinde takip olmazsa soguma ihtimali artar.</p>
              </div>
            </details>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => setHumanControl(false)}
                className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-black hover:bg-primary/90"
              >
                AI cevaplasin
              </button>
              <button
                onClick={() => setHumanControl(true)}
                className="w-full rounded-lg border border-cyan-500/35 bg-cyan-500/15 px-3 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/25"
              >
                Temsilci devral
              </button>
              <button
                onClick={() => setAiPaused((value) => !value)}
                className="w-full rounded-lg border border-violet-500/35 bg-violet-500/15 px-3 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/25"
              >
                {aiPaused ? (
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
              <button className="w-full rounded-lg border border-orange-500/35 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold text-orange-100 hover:bg-orange-500/25">
                <span className="inline-flex items-center gap-2">
                  <CalendarPlus2 className="h-4 w-4" />
                  Randevu olustur
                </span>
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
              <p className="mb-1 inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                Operasyon notu
              </p>
              <p>
                Aksiyon butonlari oncelik sirasina gore dizildi: AI cevap, handoff,
                pause/resume, randevu.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
