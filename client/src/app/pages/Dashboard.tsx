import { MessageSquare, Users, TrendingUp, UserCheck, ArrowUp, ArrowDown, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router';

const metrics = [
  {
    name: 'AI Response Success',
    value: '94.2%',
    change: '+2.3%',
    isPositive: true,
    icon: Sparkles,
    color: 'from-[#A3FF00]/20 to-[#A3FF00]/5'
  },
  {
    name: 'AI Handled Conversations',
    value: '161',
    change: '87.5%',
    isPositive: true,
    icon: MessageSquare,
    color: 'from-[#00d9ff]/20 to-[#00d9ff]/5'
  },
  {
    name: 'Human Takeover Rate',
    value: '12.5%',
    change: '-1.8%',
    isPositive: true,
    icon: UserCheck,
    color: 'from-[#8b5cf6]/20 to-[#8b5cf6]/5'
  },
  {
    name: 'Conversion Rate',
    value: '24.8%',
    change: '+3.2%',
    isPositive: true,
    icon: TrendingUp,
    color: 'from-[#ff0080]/20 to-[#ff0080]/5'
  },
];

const messagesData = [
  { time: '00:00', messages: 45 },
  { time: '04:00', messages: 28 },
  { time: '08:00', messages: 89 },
  { time: '12:00', messages: 156 },
  { time: '16:00', messages: 203 },
  { time: '20:00', messages: 178 },
  { time: '23:59', messages: 142 },
];

const conversionData = [
  { day: 'Mon', rate: 22 },
  { day: 'Tue', rate: 25 },
  { day: 'Wed', rate: 23 },
  { day: 'Thu', rate: 28 },
  { day: 'Fri', rate: 26 },
  { day: 'Sat', rate: 24 },
  { day: 'Sun', rate: 25 },
];

const conversations = [
  { id: 1, name: 'Ahmet Yılmaz', phone: '+90 532 123 4567', message: 'Ürün fiyatları hakkında bilgi alabilir miyim?', status: 'hot', time: '2 dk önce' },
  { id: 2, name: 'Zeynep Demir', phone: '+90 543 987 6543', message: 'Teslimat süresi ne kadar?', status: 'qualified', time: '5 dk önce' },
  { id: 3, name: 'Mehmet Kaya', phone: '+90 555 234 5678', message: 'Merhaba', status: 'new', time: '8 dk önce' },
  { id: 4, name: 'Ayşe Şahin', phone: '+90 534 876 5432', message: 'Toplu alımda indirim var mı?', status: 'hot', time: '12 dk önce' },
  { id: 5, name: 'Can Öztürk', phone: '+90 542 345 6789', message: 'Demo talep ediyorum', status: 'qualified', time: '15 dk önce' },
  { id: 6, name: 'Elif Arslan', phone: '+90 533 456 7890', message: 'Ödeme seçenekleri neler?', status: 'qualified', time: '18 dk önce' },
];

const aiInsights = [
  { type: 'objection', title: 'En Çok Sorulan İtiraz', content: 'Fiyat yüksek görülüyor', count: 23 },
  { type: 'question', title: 'Popüler Soru', content: 'Teslimat süresi sorgulaması', count: 45 },
  { type: 'suggestion', title: 'AI Önerisi', content: 'Daha agresif CTA kullanılmalı', priority: 'high' },
];

const statusColors = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  qualified: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hot: 'bg-red-500/20 text-red-400 border-red-500/30',
  lost: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function Dashboard() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1600px] p-8">
        {/* Get Started Banner (optional - for new users) */}
        {/* Uncomment to show for first-time users */}
        {/* <div className="mb-6 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-[#00d9ff]/10 to-primary/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20 border border-primary/30">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Train Your AI Sales Assistant</h3>
                <p className="text-sm text-muted-foreground">Let AI learn from your website and Instagram before handling customer conversations</p>
              </div>
            </div>
            <Link to="/ai-setup">
              <button className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div> */}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
                WhatsApp Sales Engine
              </h1>
              <p className="text-muted-foreground">Brand-aware AI sales assistant trained on your business</p>
            </div>
            <Link to="/ai-knowledge" className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-3 hover:scale-105 transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Trained & Active</span>
              </div>
              <p className="text-xs text-muted-foreground">Last updated 2 hours ago • Click to edit</p>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${metric.color} backdrop-blur-xl p-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.color} border border-border/50`}>
                  <metric.icon className="h-6 w-6 text-foreground" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${metric.isPositive ? 'text-primary' : 'text-red-400'}`}>
                  {metric.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {metric.change}
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{metric.value}</h3>
              <p className="text-sm text-muted-foreground">{metric.name}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Messages Over Time */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50"></div>
              Messages Over Time
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={messagesData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A3FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(163, 255, 0, 0.1)" />
                <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.3)" />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(163, 255, 0, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#A3FF00"
                  strokeWidth={3}
                  fill="url(#colorMessages)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Trend */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#ff0080] animate-pulse shadow-lg shadow-[#ff0080]/50"></div>
              Conversion Trend
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 0, 128, 0.1)" />
                <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.3)" />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(255, 0, 128, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#ff0080"
                  strokeWidth={3}
                  dot={{ fill: '#ff0080', r: 5 }}
                  activeDot={{ r: 7, fill: '#ff0080', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Feed */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Active Conversations
              </h2>
            </div>
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="px-6 py-4 hover:bg-secondary/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{conv.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[conv.status as keyof typeof statusColors]}`}>
                          {conv.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{conv.phone}</p>
                      <p className="text-sm text-foreground/80">{conv.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{conv.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-card/60 to-card/40 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </h2>

            {/* Brand Intelligence */}
            <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <p className="text-xs font-semibold text-primary mb-2">🧠 Using Brand Intelligence</p>
              <p className="text-xs text-muted-foreground">AI is applying your brand tone, product knowledge, and sales strategy in real-time conversations</p>
            </div>

            <div className="space-y-4">
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-all"
                >
                  {insight.type === 'objection' && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <h3 className="text-sm font-semibold text-red-400">{insight.title}</h3>
                      </div>
                      <p className="text-sm text-foreground mb-2">{insight.content}</p>
                      <span className="text-xs text-muted-foreground">{insight.count} kez tespit edildi</span>
                    </>
                  )}
                  {insight.type === 'question' && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-blue-400">{insight.title}</h3>
                      </div>
                      <p className="text-sm text-foreground mb-2">{insight.content}</p>
                      <span className="text-xs text-muted-foreground">{insight.count} soru</span>
                    </>
                  )}
                  {insight.type === 'suggestion' && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-primary">{insight.title}</h3>
                      </div>
                      <p className="text-sm text-foreground">{insight.content}</p>
                      <div className="mt-2 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-xs font-semibold text-primary inline-block">
                        Yüksek Öncelik
                      </div>
                    </>
                  )}
                </div>
              ))}

              <div className="mt-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Human Takeover</h4>
                    <p className="text-xs text-muted-foreground mb-2">Bugün 12 görüşme insan temsilciye aktarıldı</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-[68%] bg-gradient-to-r from-primary to-[#00d9ff]"></div>
                      </div>
                      <span className="text-xs font-semibold text-primary">68%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
