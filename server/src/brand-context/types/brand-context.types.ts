export interface ResolvedBrandContext {
  brandName: string | null;
  toneProfile: {
    primaryTone: string | null;
    toneHints: string[];
    salesStyle: 'soft' | 'balanced' | 'aggressive' | null;
  };
  audienceProfile: {
    targetAudience: string | null;
    positioningHints: string[];
  };
  productKnowledge: Array<{
    name: string;
    summary: string;
    pricePositioning?: string | null;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  responseRules: {
    forbiddenResponses: string[];
    handoffRules: string[];
    customRules: string[];
  };
  sourceSummary: {
    websiteAvailable: boolean;
    instagramAvailable: boolean;
    manualTrainingAvailable: boolean;
  };
}

export type SourceStatusState = 'ready' | 'missing' | 'stale';

export interface SourceStatusJson {
  website: {
    available: boolean;
    status: SourceStatusState;
    lastAnalyzedAt: string | null;
    warnings: string[];
  };
  instagram: {
    available: boolean;
    status: SourceStatusState;
    lastAnalyzedAt: string | null;
    warnings: string[];
  };
  manualTraining: {
    available: boolean;
    status: SourceStatusState;
    updatedAt: string | null;
    warnings: string[];
  };
}

export interface ConfidenceJson {
  website: number | null;
  instagram: number | null;
  manualTraining: number | null;
  overall: number;
}

export interface ResolvedBrandContextResult {
  resolvedContext: ResolvedBrandContext;
  sourceStatus: SourceStatusJson;
  confidence: ConfidenceJson;
  lastResolvedAt: Date;
}
