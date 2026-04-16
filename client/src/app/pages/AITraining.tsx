import { Brain, Sparkles, Save, Upload, FileText, MessageSquare, AlertCircle } from 'lucide-react';

const toneOptions = [
  { value: 'friendly', label: 'Friendly & Casual', description: 'Warm and approachable tone' },
  { value: 'premium', label: 'Premium & Professional', description: 'Sophisticated and polished' },
  { value: 'aggressive', label: 'Aggressive & Direct', description: 'Bold and persuasive' },
];

const salesStyleOptions = [
  { value: 'soft', label: 'Soft Sell', description: 'Consultative approach' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of education and persuasion' },
  { value: 'aggressive', label: 'Hard Sell', description: 'Direct and action-oriented' },
];

const sampleFAQs = [
  { question: 'Fiyatlarınız nedir?', answer: 'Paketlerimiz ₺2,999 ile ₺9,999 arasında değişmektedir...' },
  { question: 'Teslimat süresi ne kadar?', answer: '2-3 iş günü içinde teslim edilir...' },
  { question: 'Deneme sürümü var mı?', answer: '14 gün ücretsiz deneme sunuyoruz...' },
];

export function AITraining() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            AI Satış Eğitimi
          </h1>
          <p className="text-muted-foreground">Configure your AI sales assistant's personality and knowledge base</p>
        </div>

        <div className="space-y-6">
          {/* Brand Tone */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Brand Tone</h2>
                <p className="text-sm text-muted-foreground">How should your AI communicate?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {toneOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="tone"
                    value={option.value}
                    defaultChecked={option.value === 'premium'}
                    className="peer sr-only"
                  />
                  <div className="rounded-lg border-2 border-border bg-secondary/30 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:shadow-lg peer-checked:shadow-primary/20 hover:bg-secondary/50">
                    <h3 className="font-semibold mb-1">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sales Style */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sales Style</h2>
                <p className="text-sm text-muted-foreground">Choose your sales approach</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesStyleOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="salesStyle"
                    value={option.value}
                    defaultChecked={option.value === 'balanced'}
                    className="peer sr-only"
                  />
                  <div className="rounded-lg border-2 border-border bg-secondary/30 p-4 transition-all peer-checked:border-blue-400 peer-checked:bg-blue-500/10 peer-checked:shadow-lg peer-checked:shadow-blue-500/20 hover:bg-secondary/50">
                    <h3 className="font-semibold mb-1">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Product Knowledge */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Product Knowledge</h2>
                <p className="text-sm text-muted-foreground">Teach the AI about your products and services</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Product Description</label>
                <textarea
                  rows={6}
                  placeholder="Ürünleriniz ve hizmetleriniz hakkında detaylı bilgi girin..."
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm"
                  defaultValue="WhatsApp Sales Engine, işletmelerin WhatsApp üzerinden gelen mesajları otomatik olarak yanıtlayan, lead'leri nitelendiren ve satışa yönlendiren yapay zeka destekli bir SaaS platformudur. Platform, müşteri itirazlarını tespit edip yanıtlar, konuşmaları analiz eder ve gerektiğinde insan temsilcilere sorunsuz geçiş yapar."
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Unique Value Propositions</label>
                <textarea
                  rows={4}
                  placeholder="Rakiplerinizden farklı olarak ne sunuyorsunuz?"
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm"
                  defaultValue="• 7/24 otomatik yanıt sistemi&#10;• %87 lead nitelendirme başarı oranı&#10;• Anında insan temsilciye geçiş&#10;• Türkçe dil desteği ve yerel pazar bilgisi"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Upload Product Documents</label>
                <button className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 group">
                  <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, TXT (Max 10MB)</span>
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Management */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <FileText className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">FAQ Database</h2>
                  <p className="text-sm text-muted-foreground">Common questions and answers</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Add FAQ
              </button>
            </div>

            <div className="space-y-3">
              {sampleFAQs.map((faq, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                    <button className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objection Handling */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Objection Handling Rules</h2>
                <p className="text-sm text-muted-foreground">How should AI handle common objections?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Price Objection</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-all"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                  </label>
                </div>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  defaultValue="Değeri vurgula, ROI hesapla, kampanya öner, rakip karşılaştırması yap. Demo öner ve başarı hikayesi paylaş."
                />
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Time Objection</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-all"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                  </label>
                </div>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  defaultValue="Aciliyeti vurgula, kaçırılan fırsat maliyetini hesapla, kısa implementasyon süresini belirt."
                />
              </div>

              <button className="w-full px-4 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-all">
                + Add New Objection Rule
              </button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-6">Advanced Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold mb-2 block">Response Speed</label>
                <select className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm">
                  <option>Instant (0-1s)</option>
                  <option selected>Natural (1-3s)</option>
                  <option>Thoughtful (3-5s)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Creativity Level</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="70"
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(to right, #A3FF00 0%, #A3FF00 70%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.1) 100%)'
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-card/60 border border-border">
              <div>
                <h3 className="font-semibold text-sm mb-1">Auto-Learning from Successful Conversations</h3>
                <p className="text-xs text-muted-foreground">AI will learn from high-converting conversations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 p-6 rounded-xl border border-border bg-card/90 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold transition-all">
                Reset to Default
              </button>
              <button className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                <Save className="h-4 w-4" />
                Save Training
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
