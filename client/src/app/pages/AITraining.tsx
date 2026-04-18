import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  FileText,
  MessageSquare,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react';
import { ErrorState, LoadingState } from '../components/shared/PageStates';
import {
  fetchBrandContext,
  fetchTrainingSettings,
  saveBrandProfile,
  updateTrainingSettings,
} from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

const toneOptions = [
  {
    value: 'friendly',
    label: 'Friendly & Casual',
    description: 'Warm and approachable tone',
  },
  {
    value: 'premium',
    label: 'Premium & Professional',
    description: 'Sophisticated and polished',
  },
  {
    value: 'aggressive',
    label: 'Aggressive & Direct',
    description: 'Bold and persuasive',
  },
];

const salesStyleOptions = [
  {
    value: 'soft',
    label: 'Soft Sell',
    description: 'Consultative approach',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Mix of education and persuasion',
  },
  {
    value: 'aggressive',
    label: 'Hard Sell',
    description: 'Direct and action-oriented',
  },
];

function asTextLines(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function AITraining() {
  const brandQuery = useApiQuery(fetchBrandContext);
  const trainingQuery = useApiQuery(fetchTrainingSettings);

  const [tone, setTone] = useState('premium');
  const [salesStyle, setSalesStyle] = useState('balanced');
  const [productDescription, setProductDescription] = useState('');
  const [faqText, setFaqText] = useState('');
  const [objectionRules, setObjectionRules] = useState('');
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

    if (typeof brandQuery.data.brandContext?.tone === 'string') {
      const normalized = brandQuery.data.brandContext.tone.toLowerCase();
      if (normalized.includes('friendly')) {
        setTone('friendly');
      } else if (normalized.includes('aggressive')) {
        setTone('aggressive');
      } else {
        setTone('premium');
      }
    }

    if (typeof brandQuery.data.brandContext?.salesStyle === 'string') {
      const style = brandQuery.data.brandContext.salesStyle;
      if (style === 'soft' || style === 'balanced' || style === 'aggressive') {
        setSalesStyle(style);
      }
    }

    const products = trainingQuery.data.trainingSettings.productsJson
      .map((item) => {
        if (typeof item.name === 'string') {
          return item.name;
        }
        return JSON.stringify(item);
      })
      .join('\n');
    setProductDescription(products);

    const faq = trainingQuery.data.trainingSettings.faqJson
      .map((item) => {
        const question = typeof item.question === 'string' ? item.question : '';
        const answer = typeof item.answer === 'string' ? item.answer : '';
        if (!question || !answer) {
          return JSON.stringify(item);
        }
        return `S: ${question}\nC: ${answer}`;
      })
      .join('\n\n');
    setFaqText(faq);

    const rules = trainingQuery.data.trainingSettings.handoffRulesJson.join('\n');
    setObjectionRules(rules);

    hydratedRef.current = true;
  }, [brandQuery.data, trainingQuery.data]);

  const isLoading = brandQuery.isLoading || trainingQuery.isLoading;
  const error = brandQuery.error ?? trainingQuery.error;

  const onSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
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

      const rules = asTextLines(objectionRules);

      await Promise.all([
        saveBrandProfile({
          tone,
          salesStyle,
        }),
        updateTrainingSettings({
          productsJson: asTextLines(productDescription).map((name) => ({ name })),
          faqJson: faqBlocks,
          rulesJson: {
            objectionRules: rules,
          },
          handoffRulesJson: rules,
        }),
      ]);

      await Promise.all([brandQuery.refetch(), trainingQuery.refetch()]);
      setSaveMessage('Training ayarlari kaydedildi.');
    } catch (errorValue: unknown) {
      setSaveError(
        errorValue instanceof Error
          ? errorValue.message
          : 'Training kaydi basarisiz oldu.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-5xl p-8">
          <LoadingState
            title="AI training yukleniyor"
            description="Brand context ve training settings backend'den aliniyor."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-5xl p-8">
          <ErrorState
            title="AI training verisi alinamadi"
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

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-8">
          <h1 className="mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            AI Satis Egitimi
          </h1>
          <p className="text-muted-foreground">
            Configure your AI sales assistant's personality and knowledge base
          </p>
        </div>

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

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Brand Tone</h2>
                <p className="text-sm text-muted-foreground">How should your AI communicate?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {toneOptions.map((option) => (
                <label key={option.value} className="group relative cursor-pointer">
                  <input
                    type="radio"
                    name="tone"
                    value={option.value}
                    checked={tone === option.value}
                    onChange={(event) => setTone(event.target.value)}
                    className="peer sr-only"
                  />
                  <div className="rounded-lg border-2 border-border bg-secondary/30 p-4 transition-all hover:bg-secondary/50 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:shadow-lg peer-checked:shadow-primary/20">
                    <h3 className="mb-1 font-semibold">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sales Style</h2>
                <p className="text-sm text-muted-foreground">Choose your sales approach</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {salesStyleOptions.map((option) => (
                <label key={option.value} className="group relative cursor-pointer">
                  <input
                    type="radio"
                    name="salesStyle"
                    value={option.value}
                    checked={salesStyle === option.value}
                    onChange={(event) => setSalesStyle(event.target.value)}
                    className="peer sr-only"
                  />
                  <div className="rounded-lg border-2 border-border bg-secondary/30 p-4 transition-all hover:bg-secondary/50 peer-checked:border-blue-400 peer-checked:bg-blue-500/10 peer-checked:shadow-lg peer-checked:shadow-blue-500/20">
                    <h3 className="mb-1 font-semibold">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Product Knowledge</h2>
                <p className="text-sm text-muted-foreground">
                  Teach the AI about your products and services
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">Products (line by line)</label>
                <textarea
                  rows={6}
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  className="w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <FileText className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">FAQ Database</h2>
                <p className="text-sm text-muted-foreground">Common questions and answers</p>
              </div>
            </div>

            <textarea
              rows={10}
              value={faqText}
              onChange={(event) => setFaqText(event.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Objection Handling Rules</h2>
                <p className="text-sm text-muted-foreground">How should AI handle common objections?</p>
              </div>
            </div>

            <textarea
              rows={8}
              value={objectionRules}
              onChange={(event) => setObjectionRules(event.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
            />
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-xl border border-border bg-card/90 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  void Promise.all([brandQuery.refetch(), trainingQuery.refetch()]);
                }}
                className="rounded-lg bg-secondary px-6 py-3 font-semibold transition-all hover:bg-secondary/70"
              >
                Reset to Backend
              </button>
              <button
                onClick={() => {
                  void onSave();
                }}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-black transition-all hover:bg-primary/90 hover:scale-105 disabled:opacity-50"
              >
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
