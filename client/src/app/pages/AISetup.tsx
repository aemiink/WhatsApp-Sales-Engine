import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/shared/PageStates';
import {
  analyzeInstagram,
  analyzeWebsite,
  fetchBrandContext,
  fetchTrainingSettings,
  saveBrandProfile,
  updateTrainingSettings,
  type AnalyzeSourceResponse,
  type TrainingSettingsResponse,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

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
    reason:
      'AI marka dili, urun konumlandirmasi ve ana mesajlarini web iceriginden cikarir.',
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

function asTextLines(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function productTextFromSettings(data: TrainingSettingsResponse | null): string {
  if (!data) {
    return '';
  }

  return data.trainingSettings.productsJson
    .map((item) => {
      if (typeof item.name === 'string' && item.name.length > 0) {
        return item.name;
      }
      if (typeof item.title === 'string' && item.title.length > 0) {
        return item.title;
      }
      return JSON.stringify(item);
    })
    .join('\n');
}

function rulesTextFromSettings(data: TrainingSettingsResponse | null): string {
  if (!data) {
    return '';
  }

  const lines: string[] = [];

  for (const rule of data.trainingSettings.handoffRulesJson) {
    lines.push(rule);
  }

  const generalRules = data.trainingSettings.rulesJson.generalRules;
  if (Array.isArray(generalRules)) {
    for (const rule of generalRules) {
      if (typeof rule === 'string' && rule.trim().length > 0) {
        lines.push(rule.trim());
      }
    }
  }

  return Array.from(new Set(lines)).join('\n');
}

export function AISetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SetupStep>('website');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isWebsiteAnalyzing, setIsWebsiteAnalyzing] = useState(false);
  const [isInstagramAnalyzing, setIsInstagramAnalyzing] = useState(false);
  const [websiteReady, setWebsiteReady] = useState(false);
  const [instagramReady, setInstagramReady] = useState(false);
  const [websitePreview, setWebsitePreview] = useState<AnalyzeSourceResponse | null>(
    null,
  );
  const [instagramPreview, setInstagramPreview] =
    useState<AnalyzeSourceResponse | null>(null);
  const [brandTone, setBrandTone] = useState('');
  const [productsText, setProductsText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const brandQuery = useApiQuery(fetchBrandContext);
  const trainingQuery = useApiQuery(fetchTrainingSettings);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    if (!brandQuery.data || !trainingQuery.data) {
      return;
    }

    const tone =
      typeof brandQuery.data.brandContext?.tone === 'string'
        ? brandQuery.data.brandContext.tone
        : '';

    setBrandTone(tone);
    setProductsText(productTextFromSettings(trainingQuery.data));
    setRulesText(rulesTextFromSettings(trainingQuery.data));

    hydratedRef.current = true;
  }, [brandQuery.data, trainingQuery.data]);

  const currentDefinition = useMemo(
    () => steps.find((item) => item.id === currentStep)!,
    [currentStep],
  );

  const initialLoading = brandQuery.isLoading || trainingQuery.isLoading;
  const initialError = brandQuery.error ?? trainingQuery.error;

  const moveStep = (direction: 1 | -1) => {
    const next = stepIndex(currentStep) + direction;
    const bounded = Math.min(Math.max(next, 0), steps.length - 1);
    setCurrentStep(steps[bounded].id);
    setSaveMessage(null);
    setStepError(null);
  };

  const analyzeWebsiteStep = async () => {
    if (websiteUrl.trim().length === 0) {
      setWebsiteReady(true);
      return;
    }

    setStepError(null);
    setIsWebsiteAnalyzing(true);

    try {
      const result = await analyzeWebsite(websiteUrl.trim());
      setWebsitePreview(result);
      setWebsiteReady(true);
      setSaveMessage('Website analizi tamamlandi.');
      await brandQuery.refetch();
    } catch (error: unknown) {
      setStepError(error instanceof Error ? error.message : 'Website analizi basarisiz.');
      setWebsiteReady(false);
    } finally {
      setIsWebsiteAnalyzing(false);
    }
  };

  const analyzeInstagramStep = async () => {
    setStepError(null);
    setIsInstagramAnalyzing(true);

    try {
      const normalizedHandle = instagramHandle.trim();
      const result = await analyzeInstagram(
        normalizedHandle.length > 0 ? normalizedHandle : undefined,
      );
      setInstagramPreview(result);
      setInstagramReady(true);
      setSaveMessage('Instagram analizi tamamlandi.');
      await brandQuery.refetch();
    } catch (error: unknown) {
      setStepError(
        error instanceof Error ? error.message : 'Instagram analizi basarisiz.',
      );
      setInstagramReady(false);
    } finally {
      setIsInstagramAnalyzing(false);
    }
  };

  const saveCurrentStep = async (): Promise<boolean> => {
    setStepError(null);
    setSaveMessage(null);

    if (currentStep === 'website' || currentStep === 'instagram') {
      return true;
    }

    setIsSavingStep(true);

    try {
      if (currentStep === 'brand-dna') {
        await saveBrandProfile({
          tone: brandTone.trim(),
          salesStyle:
            typeof brandQuery.data?.brandContext?.salesStyle === 'string'
              ? brandQuery.data.brandContext.salesStyle
              : undefined,
        });

        await brandQuery.refetch();
        setSaveMessage('Brand DNA kaydedildi.');
        return true;
      }

      if (currentStep === 'products') {
        const products = asTextLines(productsText).map((name) => ({ name }));
        await updateTrainingSettings({
          productsJson: products,
        });
        await trainingQuery.refetch();
        setSaveMessage('Urun bilgileri kaydedildi.');
        return true;
      }

      const rules = asTextLines(rulesText);
      await updateTrainingSettings({
        handoffRulesJson: rules,
        rulesJson: {
          generalRules: rules,
        },
      });
      await trainingQuery.refetch();
      setSaveMessage('Kurallar kaydedildi.');
      return true;
    } catch (error: unknown) {
      setStepError(error instanceof Error ? error.message : 'Kayit islemi basarisiz.');
      return false;
    } finally {
      setIsSavingStep(false);
    }
  };

  const onSaveAndNext = async () => {
    if (!canProceed) {
      return;
    }

    const saved = await saveCurrentStep();
    if (saved) {
      moveStep(1);
    }
  };

  const onCompleteSetup = async () => {
    const saved = await saveCurrentStep();
    if (saved) {
      navigate('/ai-ready');
    }
  };

  const canProceed = (() => {
    if (currentStep === 'website') {
      return websiteReady || websiteUrl.trim().length === 0;
    }
    if (currentStep === 'instagram') {
      return instagramReady || instagramHandle.trim().length === 0;
    }
    if (currentStep === 'brand-dna') {
      return brandTone.trim().length > 0;
    }

    return true;
  })();

  if (initialLoading) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18]">
        <div className="mx-auto max-w-[1300px] p-6 md:p-8">
          <LoadingState
            title="Kurulum verileri yukleniyor"
            description="Brand context ve training ayarlari hazirlaniyor."
          />
        </div>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18]">
        <div className="mx-auto max-w-[1300px] p-6 md:p-8">
          <ErrorState
            title="AI Setup verileri alinamadi"
            description={initialError}
            action={
              <button
                onClick={() => {
                  void Promise.all([brandQuery.refetch(), trainingQuery.refetch()]);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black"
              >
                <RefreshCw className="h-4 w-4" />
                Tekrar dene
              </button>
            }
          />
        </div>
      </div>
    );
  }

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

        {(saveMessage || stepError) && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              stepError
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-primary/35 bg-primary/10 text-primary'
            }`}
          >
            {stepError ?? saveMessage}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            {currentStep === 'website' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Website analizi</h2>
                <p className="text-sm text-muted-foreground">
                  Web sitesi yoksa bu adimi atlayabilirsin. AI sonraki adimlardan da ogrenmeye devam eder.
                </p>
                <input
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://siteadresiniz.com"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      void analyzeWebsiteStep();
                    }}
                    disabled={isWebsiteAnalyzing}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                  >
                    Analizi baslat
                  </button>
                  <button
                    onClick={() => {
                      setWebsiteReady(true);
                      setSaveMessage('Website adimi atlandi.');
                    }}
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
                {websitePreview?.websiteSignals ? (
                  <article className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                    <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Analiz preview
                    </p>
                    <pre className="max-h-52 overflow-auto text-xs text-muted-foreground">
                      {JSON.stringify(websitePreview.websiteSignals, null, 2)}
                    </pre>
                  </article>
                ) : (
                  <EmptyState
                    title="Website analizi bekleniyor"
                    description="Analiz sonrasi burada signal ozeti gosterilecek."
                  />
                )}
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
                  onClick={() => {
                    void analyzeInstagramStep();
                  }}
                  disabled={isInstagramAnalyzing}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                >
                  Instagrami analiz et
                </button>
                {isInstagramAnalyzing ? (
                  <LoadingState
                    title="Instagram icerigi okunuyor"
                    description="Son postlar, caption kaliplari ve ton sinyalleri toplaniyor."
                  />
                ) : null}
                {instagramPreview?.instagramSignals ? (
                  <article className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                    <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Ton preview
                    </p>
                    <pre className="max-h-52 overflow-auto text-xs text-muted-foreground">
                      {JSON.stringify(instagramPreview.instagramSignals, null, 2)}
                    </pre>
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
                  rows={8}
                  value={brandTone}
                  onChange={(event) => setBrandTone(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <article className="rounded-lg border border-border bg-secondary/35 p-4 text-sm text-muted-foreground">
                  Bu alan kaydedildiginde brand context tablosuna yazilir ve AI cevaplarina dogrudan etki eder.
                </article>
              </div>
            ) : null}

            {currentStep === 'products' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Products</h2>
                <p className="text-sm text-muted-foreground">
                  Her satira bir urun/paket olacak sekilde gir. Kayit sonrasi training settings veritabanina yazilir.
                </p>
                <textarea
                  rows={10}
                  value={productsText}
                  onChange={(event) => setProductsText(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : null}

            {currentStep === 'rules' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Rules</h2>
                <p className="text-sm text-muted-foreground">
                  Her satir bir operasyon kurali olacak sekilde gir. Handoff kurallari ve genel kurallar backend'e kaydedilir.
                </p>
                <textarea
                  rows={10}
                  value={rulesText}
                  onChange={(event) => setRulesText(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    void onCompleteSetup();
                  }}
                  disabled={isSavingStep}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  AI setup'i tamamla
                </button>
              </div>
            ) : null}
          </section>

          <aside className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="mb-2 text-lg font-bold">Bu adim neden gerekli?</h2>
            <p className="mb-4 text-sm text-muted-foreground">{currentDefinition.reason}</p>

            <div className="space-y-3">
              <div className="rounded-lg border border-primary/35 bg-primary/10 p-3 text-xs text-muted-foreground">
                Ipucu: Her adimda kaydet ve devam et akisi kullanarak onboarding'i kesintisiz tamamlayabilirsin.
              </div>

              {brandQuery.data?.lastResolvedAt ? (
                <div className="rounded-lg border border-border bg-secondary/35 p-3">
                  <p className="text-xs text-muted-foreground">Son context resolve</p>
                  <p className="text-sm font-semibold">{new Date(brandQuery.data.lastResolvedAt).toLocaleString('tr-TR')}</p>
                </div>
              ) : null}

              {brandQuery.data?.resolvedContext ? (
                <div className="rounded-lg border border-border bg-secondary/35 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Resolved context preview</p>
                  <pre className="max-h-52 overflow-auto text-[11px] text-muted-foreground">
                    {JSON.stringify(brandQuery.data.resolvedContext, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <footer className="sticky bottom-0 mt-5 flex items-center justify-between rounded-xl border border-border bg-card/85 p-4 backdrop-blur">
          <button
            onClick={() => moveStep(-1)}
            disabled={currentStep === 'website' || isSavingStep}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/45 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void saveCurrentStep();
              }}
              disabled={isSavingStep}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              Kaydet
            </button>
            <button
              onClick={() => {
                void onSaveAndNext();
              }}
              disabled={currentStep === 'rules' || !canProceed || isSavingStep}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
            >
              Kaydet ve devam et
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
