import { useState } from 'react';
import { Globe, Instagram, Sparkles, Brain, MessageSquare, Shield, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';

type SetupStep = 'website' | 'instagram' | 'brand-dna' | 'products' | 'rules';

export function AISetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SetupStep>('website');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [websiteAnalyzed, setWebsiteAnalyzed] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);

  const handleAnalyzeWebsite = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setWebsiteAnalyzed(true);
    }, 2500);
  };

  const handleConnectInstagram = () => {
    setTimeout(() => {
      setInstagramConnected(true);
    }, 1000);
  };

  const handleCreateAI = () => {
    navigate('/ai-ready');
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background via-[#0a0a0f] to-[#0f0f19]">
      <div className="mx-auto max-w-4xl p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 mb-6">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            AI Satış Asistanını Kur
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Markanızı analiz ederek size özel satış asistanı oluşturalım
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 px-8">
          {[
            { id: 'website', label: 'Website', icon: Globe },
            { id: 'instagram', label: 'Instagram', icon: Instagram },
            { id: 'brand-dna', label: 'Brand DNA', icon: Sparkles },
            { id: 'products', label: 'Products', icon: MessageSquare },
            { id: 'rules', label: 'Rules', icon: Shield },
          ].map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = ['website', 'instagram', 'brand-dna', 'products'].indexOf(currentStep) >
                               ['website', 'instagram', 'brand-dna', 'products'].indexOf(step.id);

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${idx < 4 ? 'min-w-[100px]' : ''}`}>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-primary border-primary text-black'
                      : isActive
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/30'
                      : 'border-border bg-secondary/30 text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div className={`h-0.5 w-16 mx-2 ${isCompleted ? 'bg-primary' : 'bg-border'}`}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section 1: Website Input */}
        {currentStep === 'website' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Website Analizi</h2>
                  <p className="text-sm text-muted-foreground">Markanızı tanımak için web sitenizi analiz edelim</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>

                <button
                  onClick={handleAnalyzeWebsite}
                  disabled={!websiteUrl || isAnalyzing}
                  className="w-full px-6 py-4 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-secondary disabled:text-muted-foreground text-black font-semibold transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-lg shadow-primary/30"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Website analiz ediliyor...
                    </>
                  ) : websiteAnalyzed ? (
                    <>
                      <Check className="h-5 w-5" />
                      Analiz Tamamlandı
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Analiz Et
                    </>
                  )}
                </button>
              </div>

              {websiteAnalyzed && (
                <div className="mt-6 p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                    <Check className="h-5 w-5" />
                    Website Analiz Sonuçları
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Brand Name</p>
                      <p className="font-semibold">Prompta AI</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Industry</p>
                      <p className="font-semibold">AI & SaaS</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Detected Tone</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">Professional</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Innovative</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">Tech-forward</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Positioning</p>
                      <p className="text-sm">AI-powered automation platform for modern businesses</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep('instagram')}
                    className="mt-6 w-full px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    Devam Et
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 2: Instagram Connection */}
        {currentStep === 'instagram' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                  <Instagram className="h-6 w-6 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Instagram Bağlantısı</h2>
                  <p className="text-sm text-muted-foreground">Marka tonunuzu ve içerik stilinizi öğrenelim</p>
                </div>
              </div>

              {!instagramConnected ? (
                <button
                  onClick={handleConnectInstagram}
                  className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-lg shadow-pink-500/30"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram'ı Bağla
                </button>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 rounded-lg border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">PA</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">@prompta.ai</h3>
                        <p className="text-sm text-muted-foreground">Bağlantı başarılı</p>
                      </div>
                      <Check className="h-6 w-6 text-primary ml-auto" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Content Style</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">Educational</span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Visual</span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">Modern</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tone Hints</p>
                        <p className="text-sm">Friendly, professional, solution-oriented communication</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Sample Caption Style</p>
                        <p className="text-sm italic text-foreground/80">"AI ile satışları otomatikleştirin 🚀 Daha fazla lead, daha az manuel iş..."</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep('brand-dna')}
                    className="w-full px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    Devam Et
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Brand DNA */}
        {currentStep === 'brand-dna' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Brand DNA</h2>
                  <p className="text-sm text-muted-foreground">AI tarafından oluşturuldu • İstediğiniz zaman düzenleyebilirsiniz</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                  <label className="text-sm font-semibold mb-3 block">Brand Tone</label>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {['Professional', 'Friendly', 'Innovative', 'Tech-savvy', 'Solution-focused'].map(tone => (
                      <span key={tone} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary border border-primary/30 cursor-pointer hover:bg-primary/30 transition-all">
                        {tone}
                      </span>
                    ))}
                  </div>
                  <button className="text-xs text-primary hover:underline">+ Add Custom Tone</button>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block">Sales Style</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'soft', label: 'Soft Sell', desc: 'Consultative' },
                      { value: 'balanced', label: 'Balanced', desc: 'Recommended' },
                      { value: 'aggressive', label: 'Hard Sell', desc: 'Action-oriented' },
                    ].map(style => (
                      <label key={style.value} className="relative cursor-pointer">
                        <input type="radio" name="salesStyle" value={style.value} defaultChecked={style.value === 'balanced'} className="peer sr-only" />
                        <div className="rounded-lg border-2 border-border bg-secondary/30 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:shadow-lg peer-checked:shadow-primary/20 hover:bg-secondary/50">
                          <h3 className="font-semibold mb-1">{style.label}</h3>
                          <p className="text-xs text-muted-foreground">{style.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Target Audience</label>
                  <textarea
                    rows={3}
                    defaultValue="SMB owners and entrepreneurs looking to automate their sales process with AI technology. Tech-savvy decision makers seeking innovative solutions."
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  />
                </div>

                <button
                  onClick={() => setCurrentStep('products')}
                  className="w-full px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Devam Et
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Products */}
        {currentStep === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Ürün & Hizmetler</h2>
                  <p className="text-sm text-muted-foreground">AI'ın müşterilere ne sunacağını öğretin</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Ürünlerinizi veya hizmetlerinizi anlatın</label>
                  <textarea
                    rows={6}
                    placeholder="Örnek: WhatsApp Sales Engine - AI destekli satış otomasyonu. 3 paket: Starter (₺2,999), Business (₺4,999), Enterprise (₺9,999)"
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Product Categories</label>
                    <input
                      type="text"
                      placeholder="SaaS, AI Tools, Automation"
                      className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Pricing Positioning</label>
                    <select className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm">
                      <option>Premium</option>
                      <option>Mid-range</option>
                      <option>Budget-friendly</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep('rules')}
                  className="w-full px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Devam Et
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Rules */}
        {currentStep === 'rules' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Shield className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Satış Kuralları</h2>
                  <p className="text-sm text-muted-foreground">AI'ın nasıl davranacağını belirleyin</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Sık Sorulan Sorular</label>
                  <textarea
                    rows={4}
                    placeholder="S: Fiyatlar nedir?&#10;C: Paketlerimiz ₺2,999 - ₺9,999 arasında...&#10;&#10;S: Deneme var mı?&#10;C: 14 gün ücretsiz deneme sunuyoruz..."
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Asla söylenmemesi gerekenler</label>
                  <textarea
                    rows={3}
                    placeholder="Rakip isimlerinden bahsetme, indirim vaadi verme, kesin tarih garantisi..."
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Temsilciye ne zaman devredilsin?</label>
                  <div className="space-y-2">
                    {[
                      'Müşteri özel fiyat talebi yapınca',
                      'Teknik soru sorunca',
                      'Şikayet varsa',
                      'Karar vermeye hazır olunca',
                    ].map(rule => (
                      <label key={rule} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                        <span className="text-sm">{rule}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateAI}
                  className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-primary via-[#00d9ff] to-primary hover:opacity-90 text-black font-bold text-lg transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-2xl shadow-primary/40"
                >
                  <Sparkles className="h-6 w-6" />
                  AI Satış Asistanını Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
