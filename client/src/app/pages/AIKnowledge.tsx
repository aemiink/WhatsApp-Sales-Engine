import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Save, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorState, LoadingState } from '../components/shared/PageStates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  fetchBrandContext,
  fetchTrainingSettings,
  saveBrandProfile,
  updateTrainingSettings,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

function asTextLines(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function stringifyProducts(products: Array<Record<string, unknown>>): string {
  return products
    .map((product) => {
      if (typeof product.name === 'string' && product.name.length > 0) {
        return product.name;
      }

      return JSON.stringify(product);
    })
    .join('\n');
}

function stringifyFaq(faq: Array<Record<string, unknown>>): string {
  return faq
    .map((item) => {
      const question = typeof item.question === 'string' ? item.question : '';
      const answer = typeof item.answer === 'string' ? item.answer : '';
      if (!question || !answer) {
        return JSON.stringify(item);
      }
      return `S: ${question}\nC: ${answer}`;
    })
    .join('\n\n');
}

export function AIKnowledge() {
  const brandQuery = useApiQuery(fetchBrandContext);
  const trainingQuery = useApiQuery(fetchTrainingSettings);

  const [websiteNotes, setWebsiteNotes] = useState('');
  const [instagramNotes, setInstagramNotes] = useState('');
  const [productsText, setProductsText] = useState('');
  const [faqText, setFaqText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [toneText, setToneText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    if (!brandQuery.data || !trainingQuery.data) {
      return;
    }

    const websiteSignals = brandQuery.data.resolvedContext?.sourceSummary;
    setWebsiteNotes(
      websiteSignals
        ? JSON.stringify(websiteSignals, null, 2)
        : 'Website signal verisi bulunamadi.',
    );

    const instagramSignals = brandQuery.data.resolvedContext?.toneProfile;
    setInstagramNotes(
      instagramSignals
        ? JSON.stringify(instagramSignals, null, 2)
        : 'Instagram tone verisi bulunamadi.',
    );

    setProductsText(stringifyProducts(trainingQuery.data.trainingSettings.productsJson));
    setFaqText(stringifyFaq(trainingQuery.data.trainingSettings.faqJson));

    const existingRules = trainingQuery.data.trainingSettings.handoffRulesJson;
    const customRules = trainingQuery.data.trainingSettings.rulesJson.generalRules;
    const lines: string[] = [...existingRules];
    if (Array.isArray(customRules)) {
      for (const rule of customRules) {
        if (typeof rule === 'string') {
          lines.push(rule);
        }
      }
    }
    setRulesText(Array.from(new Set(lines)).join('\n'));

    setToneText(
      typeof brandQuery.data.brandContext?.tone === 'string'
        ? brandQuery.data.brandContext.tone
        : '',
    );

    hydratedRef.current = true;
  }, [brandQuery.data, trainingQuery.data]);

  const isLoading = brandQuery.isLoading || trainingQuery.isLoading;
  const error = brandQuery.error ?? trainingQuery.error;

  const onSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const products = asTextLines(productsText).map((name) => ({ name }));
      const faqBlocks = faqText
        .split('\n\n')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => {
          const lines = entry.split('\n').map((line) => line.trim());
          const questionLine = lines.find((line) => line.toLowerCase().startsWith('s:'));
          const answerLine = lines.find((line) => line.toLowerCase().startsWith('c:'));

          if (!questionLine || !answerLine) {
            return null;
          }

          return {
            question: questionLine.replace(/^s:\s*/i, ''),
            answer: answerLine.replace(/^c:\s*/i, ''),
          };
        })
        .filter((item): item is { question: string; answer: string } => item !== null);

      const rules = asTextLines(rulesText);

      await Promise.all([
        saveBrandProfile({
          tone: toneText.trim(),
        }),
        updateTrainingSettings({
          productsJson: products,
          faqJson: faqBlocks,
          handoffRulesJson: rules,
          rulesJson: {
            generalRules: rules,
          },
        }),
      ]);

      await Promise.all([brandQuery.refetch(), trainingQuery.refetch()]);
      setSaveMessage('AI knowledge verisi kaydedildi.');
    } catch (errorValue: unknown) {
      setSaveError(
        errorValue instanceof Error
          ? errorValue.message
          : 'Kayit islemi basarisiz oldu.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1400px] p-6 md:p-8">
          <LoadingState
            title="AI knowledge yukleniyor"
            description="Brand context ve training verileri backend'den aliniyor."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1400px] p-6 md:p-8">
          <ErrorState
            title="AI knowledge verisi alinamadi"
            description={error}
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

  const productsCount = asTextLines(productsText).length;
  const faqCount = faqText
    .split('\n\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0).length;
  const rulesCount = asTextLines(rulesText).length;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1400px] p-6 md:p-8">
        <PageHeader
          title="AI Knowledge / Training"
          description="AI'in bildigi kaynaklari blok bazli yonet, editable alanlarla guvenli sekilde guncelle."
          badge={
            brandQuery.data?.lastResolvedAt
              ? `Son guncelleme: ${new Date(brandQuery.data.lastResolvedAt).toLocaleString('tr-TR')}`
              : 'Henüz resolve edilmedi'
          }
          helpKey="ai-knowledge"
          actions={[
            {
              id: 'reanalyze',
              label: 'Yeniden yukle',
              variant: 'secondary',
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => {
                void Promise.all([brandQuery.refetch(), trainingQuery.refetch()]);
              },
            },
          ]}
        />

        {(saveMessage || saveError) && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              saveError
                ? 'border-red-500/35 bg-red-500/10 text-red-200'
                : 'border-primary/35 bg-primary/10 text-primary'
            }`}
          >
            {saveError ?? saveMessage}
          </div>
        )}

        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Website kaynak durumu</p>
            <p className="text-2xl font-bold">
              {brandQuery.data?.sourceStatus?.website?.status === 'fresh' ? 'fresh' : 'pending'}
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Instagram kaynak durumu</p>
            <p className="text-2xl font-bold">
              {brandQuery.data?.sourceStatus?.instagram?.status === 'fresh' ? 'fresh' : 'pending'}
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">FAQ + rules</p>
            <p className="text-2xl font-bold">{faqCount + rulesCount}</p>
          </article>
          <article className="rounded-xl border border-primary/35 bg-primary/10 p-4">
            <p className="text-xs text-muted-foreground">Products</p>
            <p className="text-2xl font-bold text-primary">{productsCount}</p>
          </article>
        </section>

        <Tabs defaultValue="website" className="rounded-xl border border-border bg-card/60 p-4">
          <TabsList className="h-auto w-full flex-wrap gap-1 bg-secondary/45 p-1">
            <TabsTrigger value="website">Website data</TabsTrigger>
            <TabsTrigger value="instagram">Instagram data</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="tone">Brand Tone</TabsTrigger>
          </TabsList>

          <TabsContent value="website" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-1 text-sm font-semibold">Website source summary</p>
              <textarea
                rows={9}
                value={websiteNotes}
                onChange={(event) => setWebsiteNotes(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="instagram" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-1 text-sm font-semibold">Instagram source summary</p>
              <textarea
                rows={9}
                value={instagramNotes}
                onChange={(event) => setInstagramNotes(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="products" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Urun bilgisi (her satir bir urun)</p>
              <textarea
                rows={10}
                value={productsText}
                onChange={(event) => setProductsText(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="faq" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">FAQ editor (S:/C: format)</p>
              <textarea
                rows={10}
                value={faqText}
                onChange={(event) => setFaqText(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Genel + handoff kurallari (satir bazli)</p>
              <textarea
                rows={10}
                value={rulesText}
                onChange={(event) => setRulesText(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="tone" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Brand tone</p>
              <textarea
                rows={8}
                value={toneText}
                onChange={(event) => setToneText(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>
        </Tabs>

        <footer className="sticky bottom-0 mt-6 flex items-center justify-between rounded-xl border border-border bg-card/85 p-4 backdrop-blur">
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Degisiklikler kaydedildikten sonra AI yanitlarina yansir.
          </p>
          <button
            onClick={() => {
              void onSave();
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Kaydet
          </button>
        </footer>
      </div>
    </div>
  );
}
