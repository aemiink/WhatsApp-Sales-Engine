import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState, LoadingState } from '../components/shared/PageStates';
import { fetchBrandContext, fetchTrainingSettings } from '../lib/api/services';
import { useApiQuery } from '../lib/api/useApiQuery';

interface CompletionItem {
  id: string;
  label: string;
  completed: boolean;
}

export function AIReady() {
  const navigate = useNavigate();
  const brandQuery = useApiQuery(fetchBrandContext, []);
  const trainingQuery = useApiQuery(fetchTrainingSettings, []);

  const isLoading = brandQuery.isLoading || trainingQuery.isLoading;
  const error = brandQuery.error ?? trainingQuery.error;

  const sourceStatus = brandQuery.data?.sourceStatus;

  const completionItems: CompletionItem[] = [
    {
      id: 'website',
      label: 'Website analyzed',
      completed: Boolean(sourceStatus?.website?.available),
    },
    {
      id: 'instagram',
      label: 'Instagram analyzed',
      completed: Boolean(sourceStatus?.instagram?.available),
    },
    {
      id: 'sales-style',
      label: 'Sales style ready',
      completed:
        typeof brandQuery.data?.brandContext?.salesStyle === 'string' ||
        typeof brandQuery.data?.resolvedContext?.toneProfile === 'object',
    },
    {
      id: 'training',
      label: 'FAQ / rules loaded',
      completed:
        (trainingQuery.data?.trainingSettings.faqJson.length ?? 0) > 0 ||
        (trainingQuery.data?.trainingSettings.handoffRulesJson.length ?? 0) > 0 ||
        Object.keys(trainingQuery.data?.trainingSettings.rulesJson ?? {}).length > 0,
    },
  ];

  const resolvedTone =
    typeof brandQuery.data?.resolvedContext?.toneProfile === 'object' &&
    brandQuery.data.resolvedContext.toneProfile !== null &&
    'primaryTone' in brandQuery.data.resolvedContext.toneProfile &&
    typeof brandQuery.data.resolvedContext.toneProfile.primaryTone === 'string'
      ? brandQuery.data.resolvedContext.toneProfile.primaryTone
      : 'Belirlenmedi';

  const resolvedBrandName =
    typeof brandQuery.data?.resolvedContext?.brandName === 'string'
      ? brandQuery.data.resolvedContext.brandName
      : 'Marka adi belirlenmedi';

  const completedCount = completionItems.filter((item) => item.completed).length;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18] p-6">
        <div className="w-full max-w-3xl">
          <LoadingState
            title="AI readiness verisi yukleniyor"
            description="Brand context ve training son durumu kontrol ediliyor."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18] p-6">
        <div className="w-full max-w-3xl">
          <ErrorState
            title="AI readiness verisi alinamadi"
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
    <div className="flex h-full items-center justify-center overflow-auto bg-gradient-to-b from-background via-[#090911] to-[#0f0f18] p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card/70 p-6 md:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/15">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">AI sistemin hazir</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Onboarding tamamlandi. AI artik canli konusmalarda marka tonunla cevap uretebilir.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tamamlanan adim: {completedCount}/{completionItems.length}
          </p>
        </div>

        <section className="mb-6 grid gap-3 sm:grid-cols-2">
          {completionItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-lg border p-3 ${
                item.completed
                  ? 'border-border bg-secondary/40'
                  : 'border-red-500/35 bg-red-500/10'
              }`}
            >
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2
                  className={`h-4 w-4 ${item.completed ? 'text-primary' : 'text-red-300'}`}
                />
                {item.label}
              </p>
            </article>
          ))}
        </section>

        <section className="mb-6 rounded-lg border border-primary/35 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">Neler ogrenildi?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {resolvedBrandName} icin temel ton: {resolvedTone}. Urun ve kural bilgileri training settings uzerinden context'e eklendi.
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-black hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
            Canli Sohbetlere Gec
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/45 px-4 py-3 text-sm font-semibold hover:bg-secondary/65"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard'a Git
          </button>
        </div>

        <button
          onClick={() => navigate('/ai-knowledge')}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          AI bilgi merkezini ac
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
