import { useState } from 'react';
import { Search, Filter, Download, UserPlus, Phone, Mail, Calendar, MessageSquare, Star, TrendingUp } from 'lucide-react';

type LeadStatus = 'new' | 'qualified' | 'hot' | 'lost';

interface Lead {
  id: number;
  name: string;
  phone: string;
  status: LeadStatus;
  product: string;
  score: number;
  lastContact: string;
  notes: string;
}

const leads: Lead[] = [
  { id: 1, name: 'Ahmet Yılmaz', phone: '+90 532 123 4567', status: 'hot', product: 'Business Premium', score: 95, lastContact: '2 saat önce', notes: 'Demo talep etti, çok ilgili' },
  { id: 2, name: 'Zeynep Demir', phone: '+90 543 987 6543', status: 'qualified', product: 'Starter Premium', score: 78, lastContact: '5 saat önce', notes: 'Fiyat sordu, bütçe onayı bekliyor' },
  { id: 3, name: 'Mehmet Kaya', phone: '+90 555 234 5678', status: 'new', product: '-', score: 45, lastContact: '8 saat önce', notes: 'İlk temas' },
  { id: 4, name: 'Ayşe Şahin', phone: '+90 534 876 5432', status: 'hot', product: 'Enterprise Premium', score: 92, lastContact: '1 gün önce', notes: 'Toplu alım yapacak' },
  { id: 5, name: 'Can Öztürk', phone: '+90 542 345 6789', status: 'qualified', product: 'Business Premium', score: 82, lastContact: '1 gün önce', notes: 'Demo gördü, karar aşamasında' },
  { id: 6, name: 'Elif Arslan', phone: '+90 533 456 7890', status: 'qualified', product: 'Starter Premium', score: 75, lastContact: '2 gün önce', notes: 'Ödeme planı bilgisi istedi' },
  { id: 7, name: 'Burak Yıldız', phone: '+90 535 567 8901', status: 'lost', product: 'Business Premium', score: 35, lastContact: '3 gün önce', notes: 'Rakibe geçti' },
  { id: 8, name: 'Selin Koç', phone: '+90 536 678 9012', status: 'new', product: '-', score: 50, lastContact: '3 gün önce', notes: 'Fiyat araştırması yapıyor' },
];

const statusColors = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  qualified: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hot: 'bg-red-500/20 text-red-400 border-red-500/30',
  lost: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function LeadManagement() {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = selectedStatus === 'all'
    ? leads
    : leads.filter(lead => lead.status === selectedStatus);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    hot: leads.filter(l => l.status === 'hot').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card/80 backdrop-blur-xl px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
                Lead Yönetimi
              </h1>
              <p className="text-muted-foreground">Manage and track your sales leads</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold text-sm transition-all flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                <UserPlus className="h-4 w-4" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`rounded-lg border p-4 transition-all hover:scale-105 ${
                selectedStatus === 'all'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-border bg-card/60 hover:bg-secondary/50'
              }`}
            >
              <p className="text-2xl font-bold mb-1">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </button>
            <button
              onClick={() => setSelectedStatus('new')}
              className={`rounded-lg border p-4 transition-all hover:scale-105 ${
                selectedStatus === 'new'
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                  : 'border-border bg-card/60 hover:bg-secondary/50'
              }`}
            >
              <p className="text-2xl font-bold mb-1 text-blue-400">{stats.new}</p>
              <p className="text-xs text-muted-foreground">New</p>
            </button>
            <button
              onClick={() => setSelectedStatus('qualified')}
              className={`rounded-lg border p-4 transition-all hover:scale-105 ${
                selectedStatus === 'qualified'
                  ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20'
                  : 'border-border bg-card/60 hover:bg-secondary/50'
              }`}
            >
              <p className="text-2xl font-bold mb-1 text-yellow-400">{stats.qualified}</p>
              <p className="text-xs text-muted-foreground">Qualified</p>
            </button>
            <button
              onClick={() => setSelectedStatus('hot')}
              className={`rounded-lg border p-4 transition-all hover:scale-105 ${
                selectedStatus === 'hot'
                  ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                  : 'border-border bg-card/60 hover:bg-secondary/50'
              }`}
            >
              <p className="text-2xl font-bold mb-1 text-red-400">{stats.hot}</p>
              <p className="text-xs text-muted-foreground">Hot</p>
            </button>
            <button
              onClick={() => setSelectedStatus('lost')}
              className={`rounded-lg border p-4 transition-all hover:scale-105 ${
                selectedStatus === 'lost'
                  ? 'border-gray-500 bg-gray-500/10 shadow-lg shadow-gray-500/20'
                  : 'border-border bg-card/60 hover:bg-secondary/50'
              }`}
            >
              <p className="text-2xl font-bold mb-1 text-gray-400">{stats.lost}</p>
              <p className="text-xs text-muted-foreground">Lost</p>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="border-b border-border bg-card/60 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads by name, phone, or product..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <button className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold text-sm transition-all flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/80 backdrop-blur-xl border-b border-border">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Contact</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`hover:bg-secondary/30 cursor-pointer transition-all ${
                    selectedLead?.id === lead.id ? 'bg-secondary/50' : ''
                  }`}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[lead.status]}`}>
                      {lead.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm">{lead.product || '-'}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px] h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            lead.score >= 80
                              ? 'bg-primary'
                              : lead.score >= 60
                              ? 'bg-yellow-400'
                              : 'bg-blue-400'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-muted-foreground">{lead.lastContact}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <div className="w-96 border-l border-border bg-gradient-to-b from-[#0f0f19]/50 to-background overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4">
            <h2 className="text-lg font-bold">Lead Details</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Lead Info */}
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {selectedLead.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedLead.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedLead.status]}`}>
                    {selectedLead.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Product:</span>
                  <span className="text-sm font-medium">{selectedLead.product || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lead Score:</span>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className="text-sm font-bold text-primary">{selectedLead.score}/100</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Contact:</span>
                  <span className="text-sm font-medium">{selectedLead.lastContact}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Notes
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{selectedLead.notes}</p>
              <button className="w-full px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-all">
                + Add Note
              </button>
            </div>

            {/* AI Insights */}
            <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                AI Insights
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-foreground/90">
                  <strong className="text-primary">High conversion potential.</strong> Customer showed strong interest in premium features.
                </p>
                <p className="text-muted-foreground mt-2">
                  Recommended action: Schedule demo within 48 hours
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button className="w-full px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </button>
              <button className="w-full px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Send Message
              </button>
              <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#ff6b35]/20 via-[#ff0080]/20 to-[#8b5cf6]/20 hover:from-[#ff6b35]/30 hover:via-[#ff0080]/30 hover:to-[#8b5cf6]/30 border border-[#ff0080]/30 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                Call Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
