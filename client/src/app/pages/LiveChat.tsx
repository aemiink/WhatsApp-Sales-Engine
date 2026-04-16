import { useState } from 'react';
import { Send, Bot, User as UserIcon, Sparkles, CheckCheck, Clock, Target, AlertTriangle, Calendar, UserCog } from 'lucide-react';

const conversationsList = [
  { id: 1, name: 'Ahmet Yılmaz', phone: '+90 532 123 4567', lastMessage: 'Ürün fiyatları hakkında bilgi alabilir miyim?', status: 'hot', unread: 2, time: '2 dk' },
  { id: 2, name: 'Zeynep Demir', phone: '+90 543 987 6543', lastMessage: 'Teslimat süresi ne kadar?', status: 'qualified', unread: 0, time: '5 dk' },
  { id: 3, name: 'Mehmet Kaya', phone: '+90 555 234 5678', lastMessage: 'Merhaba', status: 'new', unread: 1, time: '8 dk' },
  { id: 4, name: 'Ayşe Şahin', phone: '+90 534 876 5432', lastMessage: 'Toplu alımda indirim var mı?', status: 'hot', unread: 3, time: '12 dk' },
];

const messages = [
  { id: 1, from: 'customer', text: 'Merhaba, ürünleriniz hakkında bilgi alabilir miyim?', time: '14:23', status: 'read' },
  { id: 2, from: 'ai', text: 'Merhaba! Tabii ki, size yardımcı olmaktan mutluluk duyarım. Hangi ürün kategorisiyle ilgileniyorsunuz?', time: '14:23', status: 'delivered' },
  { id: 3, from: 'customer', text: 'Premium paketlerinizi merak ediyorum', time: '14:24', status: 'read' },
  { id: 4, from: 'ai', text: 'Harika! Premium paketlerimiz işletmeniz için en kapsamlı çözümleri sunuyor. 3 farklı premium paket seçeneğimiz var:\n\n• Starter Premium - ₺2,999/ay\n• Business Premium - ₺4,999/ay\n• Enterprise Premium - ₺9,999/ay\n\nHangi ölçekte bir işletme için araştırma yapıyorsunuz?', time: '14:24', status: 'delivered' },
  { id: 5, from: 'customer', text: 'Orta ölçekli bir işletme için. Fiyat biraz yüksek gibi', time: '14:26', status: 'read' },
  { id: 6, from: 'ai', text: 'Anlıyorum. Business Premium paketimiz tam size göre olabilir. Şu anda ilk 3 ay için %30 indirim kampanyamız var, yani ₺3,499/ay olacak.\n\nAyrıca yıllık ödeme yaparsanız 2 ay ücretsiz kazanırsınız. Bu size nasıl bir bütçe sağlar?', time: '14:26', status: 'delivered' },
];

const suggestedReplies = [
  '💼 "Business Premium paketimiz tam size göre. ROI hesaplayalım mı?"',
  '🎯 "Başarı hikayelerimizi paylaşayım - benzer işletmeler %40 artış gördü"',
  '📅 "Ücretsiz demo ile sistemi canlı gösterelim"',
  '💰 "Yıllık ödeme ile 2 ay hediye kazanırsınız"',
];

const statusColors = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  qualified: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hot: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function LiveChat() {
  const [selectedConv, setSelectedConv] = useState(conversationsList[0]);
  const [aiMode, setAiMode] = useState<'auto' | 'manual'>('auto');

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations List */}
      <div className="w-80 border-r border-border bg-gradient-to-b from-[#0f0f19]/50 to-background overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-4">
          <h2 className="text-lg font-bold mb-3">Conversations</h2>
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full rounded-lg bg-input px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="divide-y divide-border">
          {conversationsList.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`px-4 py-4 cursor-pointer transition-all hover:bg-secondary/50 ${
                selectedConv.id === conv.id ? 'bg-secondary/70 border-l-2 border-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{conv.name}</h3>
                  {conv.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-black text-xs flex items-center justify-center font-bold">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{conv.time}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{conv.phone}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/70 line-clamp-1 flex-1">{conv.lastMessage}</p>
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium border ${statusColors[conv.status as keyof typeof statusColors]}`}>
                  {conv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{selectedConv.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedConv.phone}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[selectedConv.status as keyof typeof statusColors]}`}>
                {selectedConv.status.toUpperCase()}
              </span>
              {aiMode === 'auto' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-sm font-semibold text-primary">AI Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <UserCog className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">Human Control</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-background to-[#0a0a0f]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-start gap-3 max-w-[70%] ${msg.from === 'customer' ? '' : 'flex-row-reverse'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.from === 'customer'
                    ? 'bg-secondary border border-border'
                    : 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30'
                }`}>
                  {msg.from === 'customer' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.from === 'customer'
                        ? 'bg-secondary border border-border rounded-tl-none'
                        : 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-tr-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                    {msg.from === 'ai' && (
                      <CheckCheck className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card/80 backdrop-blur-xl p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                placeholder="Type your message..."
                rows={2}
                className="w-full rounded-lg bg-input px-4 py-3 text-sm border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              />
            </div>
            <button className="h-[60px] px-6 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="w-96 border-l border-border bg-gradient-to-b from-[#0f0f19]/50 to-background overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Brand Context */}
          <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-primary">Brand Context</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Tone:</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Professional</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Friendly</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Positioning:</span>
                <p className="text-foreground/80 mt-1">AI-powered automation for modern businesses</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sales Style:</span>
                <p className="text-foreground/80 mt-1">Balanced • Consultative approach</p>
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-400">AI Reasoning</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Detected Intent:</span>
                <p className="text-foreground/90 mt-1">Customer is price-sensitive but interested. Showing value proposition.</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Why This Reply:</span>
                <p className="text-foreground/90 mt-1">Addressing price objection by highlighting ROI and current discount campaign based on brand strategy.</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Next Action:</span>
                <p className="text-primary font-semibold mt-1">Schedule demo to show value in practice</p>
              </div>
            </div>
          </div>

          {/* Detected Intent */}
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Intent Analysis</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium text-yellow-400">Price Inquiry</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className="text-sm font-medium text-primary">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Probability:</span>
                <span className="text-sm font-medium text-primary">75%</span>
              </div>
            </div>
          </div>

          {/* Lead Stage */}
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-sm">Lead Stage</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-gradient-to-r from-primary via-[#00d9ff] to-[#ff0080]"></div>
                </div>
                <span className="text-xs font-semibold text-primary">75%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Müşteri fiyat itirazında bulundu. Değer önerisi güçlendirilmeli.
              </p>
            </div>
          </div>

          {/* Objection Detected */}
          <div className="rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h3 className="font-semibold text-sm text-red-400">Objection Detected</h3>
            </div>
            <p className="text-sm mb-3">Fiyat yüksek bulundu</p>
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Önerilen Yaklaşım:</strong>
              <br />
              Değer gösterimi yap, ROI hesapla, kampanya vurgula
            </div>
          </div>

          {/* Suggested Replies */}
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-sm mb-3">Suggested Replies</h3>
            <div className="space-y-2">
              {suggestedReplies.map((reply, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 rounded-lg bg-secondary/50 hover:bg-primary/10 hover:border-primary/30 border border-border text-sm transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <h3 className="font-semibold text-sm mb-3 text-primary">Recommended Next Action</h3>
            <p className="text-sm text-foreground/90 mb-4">
              Müşteri ilgili ve karar vermeye yakın. Demo önerisi yaparak süreci ilerlet.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-xs transition-all hover:scale-105">
                Demo Planla
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold text-xs transition-all">
                ROI Hesapla
              </button>
            </div>
          </div>

          {/* AI Controls */}
          <div className="space-y-2">
            <button
              onClick={() => setAiMode('auto')}
              className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                aiMode === 'auto'
                  ? 'bg-primary text-black shadow-lg shadow-primary/30'
                  : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bot className="h-4 w-4" />
                AI Cevaplasın
              </div>
            </button>
            <button
              onClick={() => setAiMode('manual')}
              className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                aiMode === 'manual'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCog className="h-4 w-4" />
                Temsilci Devral
              </div>
            </button>
            <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#ff6b35]/20 via-[#ff0080]/20 to-[#8b5cf6]/20 hover:from-[#ff6b35]/30 hover:via-[#ff0080]/30 hover:to-[#8b5cf6]/30 border border-[#ff0080]/30 font-semibold text-sm transition-all">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Randevu Oluştur
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
