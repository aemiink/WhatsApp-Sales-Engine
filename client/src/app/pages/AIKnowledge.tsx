import { Brain, Globe, Instagram, Package, MessageSquare, Shield, RefreshCw, Save, Edit3, Sparkles } from 'lucide-react';

export function AIKnowledge() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            AI Bilgi Merkezi
          </h1>
          <p className="text-muted-foreground">Manage your AI's knowledge base and training data</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Last Updated', value: '2 saat önce', icon: RefreshCw },
            { label: 'Knowledge Items', value: '47', icon: Brain },
            { label: 'Auto-learned', value: '32', icon: Sparkles },
            { label: 'Manual Entries', value: '15', icon: Edit3 },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Website Data */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold">Website Data</h2>
                  <p className="text-xs text-muted-foreground">Auto-analyzed from your website</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-sm font-semibold transition-all flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Re-analyze
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Brand Name</p>
                  <p className="font-semibold">Prompta AI</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Industry</p>
                  <p className="font-semibold">AI & SaaS</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2">Brand Tone</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">Professional</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Innovative</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">Tech-forward</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Positioning Statement</p>
                <p className="text-sm">AI-powered automation platform for modern businesses seeking to scale their operations</p>
              </div>
            </div>
          </div>

          {/* Instagram Data */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-gradient-to-r from-pink-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <Instagram className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h2 className="font-bold">Instagram Data</h2>
                  <p className="text-xs text-muted-foreground">Auto-learned from @prompta.ai</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-sm font-semibold transition-all flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2">Content Style</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">Educational</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Visual</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">Modern</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Communication Tone</p>
                <p className="text-sm">Friendly, professional, solution-oriented with emoji usage for emphasis</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2">Common Phrases</p>
                <div className="space-y-2">
                  <p className="text-sm italic">"AI ile satışları otomatikleştirin 🚀"</p>
                  <p className="text-sm italic">"Daha fazla lead, daha az manuel iş"</p>
                  <p className="text-sm italic">"7/24 AI asistanınız hazır"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products & Services */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold">Products & Services</h2>
                  <p className="text-xs text-muted-foreground">Manual entries • Editable</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition-all flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </div>
            <div className="p-6">
              <textarea
                rows={6}
                defaultValue="WhatsApp Sales Engine - AI destekli satış otomasyonu platformu&#10;&#10;Paketler:&#10;• Starter Premium - ₺2,999/ay - Küçük işletmeler için&#10;• Business Premium - ₺4,999/ay - Orta ölçek için (en popüler)&#10;• Enterprise Premium - ₺9,999/ay - Kurumsal çözüm&#10;&#10;Tüm paketler 14 gün ücretsiz deneme ile birlikte gelir."
                className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
              />
            </div>
          </div>

          {/* FAQs */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-bold">Frequently Asked Questions</h2>
                  <p className="text-xs text-muted-foreground">12 FAQs configured</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition-all flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Manage FAQs
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { q: 'Fiyatlarınız nedir?', a: 'Paketlerimiz ₺2,999 ile ₺9,999 arasında değişmektedir. İşletme büyüklüğünüze göre 3 farklı paket sunuyoruz.' },
                { q: 'Deneme sürümü var mı?', a: '14 gün ücretsiz deneme sunuyoruz. Kredi kartı bilgisi gerekmez.' },
                { q: 'Teslimat süresi ne kadar?', a: 'Kayıt olduktan sonra 2-3 iş günü içinde sisteminiz aktif olur.' },
              ].map((faq, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer">
                  <p className="font-semibold text-sm mb-2">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Rules */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-gradient-to-r from-red-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-bold">Sales Rules & Boundaries</h2>
                  <p className="text-xs text-muted-foreground">Define AI behavior limits</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition-all flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Rules
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Asla söylenmemesi gerekenler:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Rakip isimleri veya karşılaştırma yapmak</li>
                  <li>• Kesin indirim vaadi vermek</li>
                  <li>• Garanti edilemeyen tarihler söylemek</li>
                  <li>• Teknik detaylar hakkında tahmin yürütmek</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Temsilciye devir koşulları:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Özel fiyat talebi geldiğinde</li>
                  <li>• Teknik soru sorulduğunda</li>
                  <li>• Şikayet veya memnuniyetsizlik olduğunda</li>
                  <li>• Müşteri karar vermeye hazır olduğunda</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 p-6 rounded-xl border border-border bg-card/90 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm">AI will automatically learn from successful conversations</span>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold transition-all">
                Reset to Default
              </button>
              <button className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
