import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState, LoadingState } from '../components/shared/PageStates';

type SetupStep = 'website' | 'instagram' | 'brand-dna' | 'products' | 'rules';

interface StepDefinition {
  id: SetupStep;
  title: string;
  reason: string;
  helper: string;
}

const steps: StepDefinition[] = [
  {
    id: 'website',
    title: 'Website',
    reason: 'AI marka dili, urun konumlandirmasi ve ana mesajlarini web iceriginden cikarir.',
    helper: 'Markayi anlamak icin gerekli',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    reason: 'Iletisim tonu ve icerik stili sosyal medya paylasimlarindan ogrenilir.',
    helper: 'Ton ve uslup adaptasyonu',
  },
  {
    id: 'brand-dna',
    title: 'Brand DNA',
    reason: 'Otomatik cikarilan kimligi senin tercihinle netlestiririz.',
    helper: 'Son karar kontrolu',
  },
  {
    id: 'products',
    title: 'Products',
    reason: 'AI urunleri net bilirse fiyat ve deger anlatimini dogru yapar.',
    helper: 'Satis dogrulugu',
  },
  {
    id: 'rules',
    title: 'Rules',
    reason: 'Kritik sinirlar ve handoff kurallari operasyon riskini azaltir.',
    helper: 'Guvenli otomasyon',
  },
];

function stepIndex(step: SetupStep): number {
  return steps.findIndex((item) => item.id === step);
}

export function AISetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SetupStep>('website');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('@prompta.ai');
  const [isWebsiteAnalyzing, setIsWebsiteAnalyzing] = useState(false);
  const [isInstagramAnalyzing, setIsInstagramAnalyzing] = useState(false);
  const [websiteReady, setWebsiteReady] = useState(false);
  const [instagramReady, setInstagramReady] = useState(false);
  const [brandTone, setBrandTone] = useState(
    'Profesyonel, net ve cozum odakli ama sicak bir ton kullan.',
  );

  const currentDefinition = useMemo(
    () => steps.find((item) => item.id === currentStep)!,
    [currentStep],
  );

  const moveStep = (direction: 1 | -1) => {
    const next = stepIndex(currentStep) + direction;
    const bounded = Math.min(Math.max(next, 0), steps.length - 1);
    setCurrentStep(steps[bounded].id);
  };

  const analyzeWebsite = () => {
    setIsWebsiteAnalyzing(true);
    setTimeout(() => {
      setIsWebsiteAnalyzing(false);
      setWebsiteReady(true);
    }, 1400);
  };

  const analyzeInstagram = () => {
    setIsInstagramAnalyzing(true);
    setTimeout(() => {
      setIsInstagramAnalyzing(false);
      setInstagramReady(true);
    }, 1200);
  };

  const canProceed = (() => {
    if (currentStep === 'website') return websiteReady || websiteUrl.length === 0;
    if (currentStep === 'instagram') return instagramReady;
    return true;
  })();

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18]">
      <div className="mx-auto max-w-[1300px] p-6 md:p-8">
        <PageHeader
          title="AI Setup"
          description="Form doldurmak yerine AI'i adim adim egit. Her adimda neden gerekli oldugunu gor ve kaydet-devam et akisini kullan."
          badge={`Adim ${stepIndex(currentStep) + 1}/${steps.length}`}
          helpKey="ai-setup"
        />

        <div className="mb-5 rounded-xl border border-border bg-card/60 p-4">
          <ol className="grid gap-2 md:grid-cols-5">
            {steps.map((step) => {
              const current = step.id === currentStep;
              const completed = stepIndex(step.id) < stepIndex(currentStep);
              return (
                <li
                  key={step.id}
                  className={`rounded-lg border p-3 transition-all ${
                    current
                      ? 'border-primary/40 bg-primary/10'
                      : completed
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-secondary/35'
                  }`}
                >
                  <p className="mb-1 text-xs text-muted-foreground">{step.helper}</p>
                  <p className="text-sm font-semibold">
                    {completed ? '✓ ' : ''}
                    {step.title}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            {currentStep === 'website' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Website analizi</h2>
                <p className="text-sm text-muted-foreground">
                  Web sitesi yoksa bu adimi atlayabilirsin. AI sonraki adimlardan
                  da ogrenmeye devam eder.
                </p>
                <input
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://siteadresiniz.com"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={analyzeWebsite}
                    disabled={!websiteUrl || isWebsiteAnalyzing}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                  >
                    Analizi baslat
                  </button>
                  <button
                    onClick={() => setWebsiteReady(true)}
                    className="rounded-lg border border-border bg-secondary/45 px-4 py-2 text-sm font-semibold"
                  >
                    Website yok, devam et
                  </button>
                </div>
                {isWebsiteAnalyzing ? (
                  <LoadingState
                    title="Website taraniyor"
                    description="Sayfa icerikleri, marka tonu ve urun anlatimi cikariliyor."
                  />
                ) : null}
                {!websiteUrl ? (
                  <EmptyState
                    title="Website girilmedi"
                    description="Website baglantisi olmadan da kurulum tamamlanabilir. Instagram + Brand DNA adimlariyla devam edebilirsin."
                  />
                ) : null}
                {websiteReady ? (
                  <article className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                    <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Analiz preview
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Konumlandirma: AI destekli satis otomasyonu</li>
                      <li>• Ton: profesyonel + guven veren</li>
                      <li>• Ana vaat: hizli onboarding, otonom satis akis</li>
                    </ul>
                  </article>
                ) : null}
              </div>
            ) : null}

            {currentStep === 'instagram' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Instagram analizi</h2>
                <p className="text-sm text-muted-foreground">
                  Icerik stilini AI'in cevap uslubuna dahil ediyoruz.
                </p>
                <input
                  value={instagramHandle}
                  onChange={(event) => setInstagramHandle(event.target.value)}
                  placeholder="@marka_hesabi"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={analyzeInstagram}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black"
                >
                  Instagrami analiz et
                </button>
                {isInstagramAnalyzing ? (
                  <LoadingState
                    title="Instagram icerigi okunuyor"
                    description="Son postlar, caption kaliplari ve ton sinyalleri toplaniyor."
                  />
                ) : null}
                {instagramReady ? (
                  <article className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                    <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Ton preview
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Egitici + sade + sonuc odakli bir icerik dili tespit edildi.
                    </p>
                  </article>
                ) : (
                  <EmptyState
                    title="Instagram baglantisi bekleniyor"
                    description="Baglanti kuruldugunda AI sosyal dilini daha hizli uyarlayacak."
                  />
                )}
              </div>
            ) : null}

            {currentStep === 'brand-dna' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Brand DNA</h2>
                <p className="text-sm text-muted-foreground">
                  AI ozetini duzenleyerek marka sesini netlestir.
                </p>
                <textarea
                  rows={7}
                  value={brandTone}
                  onChange={(event) => setBrandTone(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <article className="rounded-lg border border-border bg-secondary/35 p-4 text-sm text-muted-foreground">
                  Bu alan editable. Degisiklikler kaydedildiginde AI cevaplarina
                  dogrudan etki eder.
                </article>
              </div>
            ) : null}

            {currentStep === 'products' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Products</h2>
                <p className="text-sm text-muted-foreground">
                  Urun, paket ve fiyat bilgisini net gir. AI teklif asamasinda bunu
                  dogrudan kullanir.
                </p>
                <textarea
                  rows={8}
                  defaultValue="Starter - 2,999 TL\nBusiness - 4,999 TL\nEnterprise - 9,999 TL\n\nTum paketlerde 14 gun deneme var."
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : null}

            {currentStep === 'rules' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Rules</h2>
                <p className="text-sm text-muted-foreground">
                  Kritik davranis kurallari ve temsilciye devir kosullarini belirle.
                </p>
                <textarea
                  rows={8}
                  defaultValue="- Indirim vaadi verme.\n- Teknik krizde handoff.\n- Müşteri sertlesirse tonu yumusat.\n- Demo talebinde randevu adimini one al."
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => navigate('/ai-ready')}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black"
                >
                  <Sparkles className="h-4 w-4" />
                  AI setup'i tamamla
                </button>
              </div>
            ) : null}
          </section>

          <aside className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="mb-2 text-lg font-bold">Bu adim neden gerekli?</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {currentDefinition.reason}
            </p>
            <div className="rounded-lg border border-primary/35 bg-primary/10 p-3 text-xs text-muted-foreground">
              Ipucu: Her adimda kaydet ve devam et akisi kullanarak onboarding'i
              kesintisiz tamamlayabilirsin.
            </div>
          </aside>
        </div>

        <footer className="sticky bottom-0 mt-5 flex items-center justify-between rounded-xl border border-border bg-card/85 p-4 backdrop-blur">
          <button
            onClick={() => moveStep(-1)}
            disabled={currentStep === 'website'}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/45 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>
          <button
            onClick={() => moveStep(1)}
            disabled={currentStep === 'rules' || !canProceed}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
          >
            Kaydet ve devam et
            <ArrowRight className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
