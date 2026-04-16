import { TrendingUp, TrendingDown, Activity, Clock, Users, Target, MessageSquare, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const conversionData = [
  { month: 'Jan', rate: 18.5, leads: 234 },
  { month: 'Feb', rate: 21.2, leads: 289 },
  { month: 'Mar', rate: 19.8, leads: 312 },
  { month: 'Apr', rate: 24.3, leads: 398 },
  { month: 'May', rate: 26.7, leads: 445 },
  { month: 'Jun', rate: 24.8, leads: 432 },
];

const responseTimeData = [
  { hour: '00:00', time: 1.2 },
  { hour: '04:00', time: 0.8 },
  { hour: '08:00', time: 2.1 },
  { hour: '12:00', time: 3.4 },
  { hour: '16:00', time: 2.8 },
  { hour: '20:00', time: 1.9 },
  { hour: '23:59', time: 1.1 },
];

const leadQualificationData = [
  { stage: 'Initial Contact', count: 847, rate: 100 },
  { stage: 'Qualified', count: 432, rate: 51 },
  { stage: 'Demo Scheduled', count: 234, rate: 27 },
  { stage: 'Proposal Sent', count: 156, rate: 18 },
  { stage: 'Closed Won', count: 89, rate: 10.5 },
];

const dropOffData = [
  { name: 'Completed', value: 432, color: '#A3FF00' },
  { name: 'Price Objection', value: 187, color: '#ff0080' },
  { name: 'No Response', value: 134, color: '#8b5cf6' },
  { name: 'Not Qualified', value: 94, color: '#00d9ff' },
];

const performanceMetrics = [
  { metric: 'Avg Response Time', value: '1.8s', change: '-0.3s', trend: 'up', icon: Clock, color: 'text-primary' },
  { metric: 'Messages Handled', value: '12.4K', change: '+18%', trend: 'up', icon: MessageSquare, color: 'text-blue-400' },
  { metric: 'Lead Qualification', value: '51%', change: '+3.2%', trend: 'up', icon: Target, color: 'text-yellow-400' },
  { metric: 'AI Accuracy', value: '94.2%', change: '+1.1%', trend: 'up', icon: Zap, color: 'text-purple-400' },
];

export function Analytics() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1600px] p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            Performans Analizi
          </h1>
          <p className="text-muted-foreground">Track your AI sales engine performance and insights</p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceMetrics.map((item) => (
            <div
              key={item.metric}
              className="relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br from-${item.color}/20 to-${item.color}/5 border border-border/50`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  {item.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {item.change}
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{item.value}</h3>
              <p className="text-sm text-muted-foreground">{item.metric}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion Rate Trend */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Conversion Rate Trend</h2>
                <p className="text-sm text-muted-foreground">Monthly conversion performance</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-semibold text-primary">+2.1% vs last month</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A3FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(163, 255, 0, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.3)" />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(163, 255, 0, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#A3FF00"
                  strokeWidth={3}
                  fill="url(#colorRate)"
                  dot={{ fill: '#A3FF00', r: 5 }}
                  activeDot={{ r: 7, fill: '#A3FF00', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Average Response Time */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Average Response Time</h2>
                <p className="text-sm text-muted-foreground">AI response speed throughout the day</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">1.8s avg</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255, 255, 255, 0.3)" />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(0, 217, 255, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#00d9ff"
                  strokeWidth={3}
                  dot={{ fill: '#00d9ff', r: 5 }}
                  activeDot={{ r: 7, fill: '#00d9ff', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Qualification Funnel & Drop-off Points */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Qualification Funnel */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Lead Qualification Funnel</h2>
              <p className="text-sm text-muted-foreground">Conversion through each stage</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={leadQualificationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(163, 255, 0, 0.1)" />
                <XAxis type="number" stroke="rgba(255, 255, 255, 0.3)" />
                <YAxis dataKey="stage" type="category" stroke="rgba(255, 255, 255, 0.3)" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(163, 255, 0, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {leadQualificationData.map((entry, index) => (
                    <Cell key={`funnel-cell-${index}`} fill={`rgba(163, 255, 0, ${1 - index * 0.15})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Drop-off Points */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Drop-off Analysis</h2>
              <p className="text-sm text-muted-foreground">Why conversations end</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dropOffData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dropOffData.map((entry, index) => (
                    <Cell key={`dropoff-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(163, 255, 0, 0.2)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-3">
              {dropOffData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Performance Insights */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/20 border border-primary/30">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">AI Performance Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Best Performing Time</p>
                  <p className="text-lg font-bold text-primary">16:00 - 20:00</p>
                  <p className="text-xs text-muted-foreground mt-1">28% conversion rate during this window</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Top Objection Handled</p>
                  <p className="text-lg font-bold text-primary">Price Concerns</p>
                  <p className="text-xs text-muted-foreground mt-1">Successfully handled 78% of price objections</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Human Takeover Rate</p>
                  <p className="text-lg font-bold text-primary">12.4%</p>
                  <p className="text-xs text-muted-foreground mt-1">AI resolves 87.6% autonomously</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
