import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { InstagramSignals } from '../instagram-analysis/types/instagram-analysis.types';
import { WebsiteSignals } from '../website-analysis/types/website-analysis.types';
import {
  ConfidenceJson,
  ResolvedBrandContext,
  ResolvedBrandContextResult,
  SourceStatusJson,
  SourceStatusState,
} from './types/brand-context.types';

interface ResolveWarningsInput {
  websiteWarnings?: string[];
  instagramWarnings?: string[];
  manualWarnings?: string[];
}

interface ManualTrainingContext {
  products: Array<{
    name: string;
    summary: string;
    pricePositioning?: string | null;
  }>;
  faq: Array<{ question: string; answer: string }>;
  forbiddenResponses: string[];
  handoffRules: string[];
  customRules: string[];
  toneHints: string[];
  targetAudience: string | null;
  positioningHints: string[];
  preferredSalesStyle: 'soft' | 'balanced' | 'aggressive' | null;
  preferredTone: string | null;
}

@Injectable()
export class BrandContextResolverService {
  private readonly logger = new Logger(BrandContextResolverService.name);
  private readonly staleDays = 30;
  private readonly manualStaleDays = 120;

  constructor(private readonly prisma: PrismaService) {}

  async getResolvedContext(
    workspaceId: string,
  ): Promise<ResolvedBrandContextResult> {
    const existing = await this.prisma.brandContext.findUnique({
      where: {
        workspaceId,
      },
    });

    if (
      !existing?.resolvedContextJson ||
      !existing.sourceStatusJson ||
      !existing.confidenceJson ||
      !existing.lastResolvedAt
    ) {
      return this.resolveForWorkspace(workspaceId);
    }

    return {
      resolvedContext: this.parseResolvedContext(existing.resolvedContextJson),
      sourceStatus: this.parseSourceStatus(existing.sourceStatusJson),
      confidence: this.parseConfidence(existing.confidenceJson),
      lastResolvedAt: existing.lastResolvedAt,
    };
  }

  async refreshResolvedContext(
    workspaceId: string,
    warningsInput: ResolveWarningsInput = {},
  ): Promise<ResolvedBrandContextResult> {
    return this.resolveForWorkspace(workspaceId, warningsInput);
  }

  async resolveForWorkspace(
    workspaceId: string,
    warningsInput: ResolveWarningsInput = {},
  ): Promise<ResolvedBrandContextResult> {
    const [brandContext, websiteSnapshot, instagramSnapshot, trainingSettings] =
      await Promise.all([
        this.prisma.brandContext.findUnique({
          where: {
            workspaceId,
          },
        }),
        this.prisma.websiteAnalysisSnapshot.findFirst({
          where: {
            workspaceId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.instagramAnalysisSnapshot.findFirst({
          where: {
            workspaceId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.trainingSetting.findUnique({
          where: {
            workspaceId,
          },
        }),
      ]);

    const websiteSignals = this.toWebsiteSignals(
      websiteSnapshot?.extractedSignalsJson ?? null,
    );
    const instagramSignals = this.toInstagramSignals(
      instagramSnapshot?.extractedSignalsJson ?? null,
    );
    const manualContext = this.extractManualTrainingContext(trainingSettings);

    const resolvedContext = this.buildResolvedContext(
      websiteSignals,
      instagramSignals,
      manualContext,
      brandContext?.tone ?? null,
      brandContext?.salesStyle ?? null,
    );
    const sourceStatus = this.buildSourceStatus(
      websiteSnapshot?.createdAt ?? null,
      instagramSnapshot?.createdAt ?? null,
      trainingSettings?.updatedAt ?? null,
      resolvedContext,
      warningsInput,
    );
    const confidence = this.buildConfidence(
      websiteSnapshot?.confidence ?? null,
      instagramSnapshot?.confidence ?? null,
      manualContext,
    );
    const lastResolvedAt = new Date();

    await this.prisma.brandContext.upsert({
      where: {
        workspaceId,
      },
      create: {
        workspaceId,
        tone: resolvedContext.toneProfile.primaryTone ?? null,
        salesStyle: resolvedContext.toneProfile.salesStyle ?? null,
        dataJson:
          (brandContext?.dataJson as Prisma.InputJsonValue) ?? undefined,
        sourceStatusJson: sourceStatus as unknown as Prisma.InputJsonValue,
        websiteSignalsJson:
          (websiteSignals as unknown as Prisma.InputJsonValue) ??
          Prisma.JsonNull,
        instagramSignalsJson:
          (instagramSignals as unknown as Prisma.InputJsonValue) ??
          Prisma.JsonNull,
        resolvedContextJson:
          resolvedContext as unknown as Prisma.InputJsonValue,
        confidenceJson: confidence as unknown as Prisma.InputJsonValue,
        lastResolvedAt,
      },
      update: {
        tone:
          resolvedContext.toneProfile.primaryTone ?? brandContext?.tone ?? null,
        salesStyle:
          resolvedContext.toneProfile.salesStyle ??
          brandContext?.salesStyle ??
          null,
        sourceStatusJson: sourceStatus as unknown as Prisma.InputJsonValue,
        websiteSignalsJson:
          (websiteSignals as unknown as Prisma.InputJsonValue) ??
          Prisma.JsonNull,
        instagramSignalsJson:
          (instagramSignals as unknown as Prisma.InputJsonValue) ??
          Prisma.JsonNull,
        resolvedContextJson:
          resolvedContext as unknown as Prisma.InputJsonValue,
        confidenceJson: confidence as unknown as Prisma.InputJsonValue,
        lastResolvedAt,
      },
    });

    this.logger.log(`Brand context resolved workspace=${workspaceId}`);

    return {
      resolvedContext,
      sourceStatus,
      confidence,
      lastResolvedAt,
    };
  }

  private buildResolvedContext(
    websiteSignals: WebsiteSignals,
    instagramSignals: InstagramSignals,
    manualContext: ManualTrainingContext,
    legacyTone: string | null,
    legacySalesStyle: string | null,
  ): ResolvedBrandContext {
    const toneHints = this.unique([
      ...websiteSignals.toneHints,
      ...instagramSignals.toneHints,
      ...manualContext.toneHints,
    ]);

    const primaryTone =
      manualContext.preferredTone ??
      legacyTone ??
      toneHints[0] ??
      this.detectFallbackTone(websiteSignals, instagramSignals);

    const salesStyle =
      manualContext.preferredSalesStyle ??
      this.toSalesStyle(legacySalesStyle) ??
      instagramSignals.salesStyle;

    const productKnowledge =
      manualContext.products.length > 0
        ? manualContext.products
        : websiteSignals.productFocusHints.map((hint) => ({
            name: hint,
            summary: 'Derived from website page headings.',
            pricePositioning: null,
          }));

    return {
      brandName:
        websiteSignals.brandName ??
        manualContext.products[0]?.name ??
        instagramSignals.username,
      toneProfile: {
        primaryTone: primaryTone ?? null,
        toneHints,
        salesStyle,
      },
      audienceProfile: {
        targetAudience: manualContext.targetAudience,
        positioningHints: this.unique([
          ...websiteSignals.positioningHints,
          ...manualContext.positioningHints,
        ]),
      },
      productKnowledge,
      faq: manualContext.faq,
      responseRules: {
        forbiddenResponses: manualContext.forbiddenResponses,
        handoffRules: manualContext.handoffRules,
        customRules: manualContext.customRules,
      },
      sourceSummary: {
        websiteAvailable: this.hasWebsiteSignals(websiteSignals),
        instagramAvailable: this.hasInstagramSignals(instagramSignals),
        manualTrainingAvailable:
          manualContext.products.length > 0 ||
          manualContext.faq.length > 0 ||
          manualContext.customRules.length > 0 ||
          manualContext.forbiddenResponses.length > 0 ||
          manualContext.handoffRules.length > 0,
      },
    };
  }

  private buildSourceStatus(
    websiteAnalyzedAt: Date | null,
    instagramAnalyzedAt: Date | null,
    manualUpdatedAt: Date | null,
    resolvedContext: ResolvedBrandContext,
    warningsInput: ResolveWarningsInput,
  ): SourceStatusJson {
    const websiteStatus = this.stateFromDate(websiteAnalyzedAt, this.staleDays);
    const instagramStatus = this.stateFromDate(
      instagramAnalyzedAt,
      this.staleDays,
    );
    const manualStatus = this.stateFromDate(
      manualUpdatedAt,
      this.manualStaleDays,
    );

    return {
      website: {
        available: resolvedContext.sourceSummary.websiteAvailable,
        status: resolvedContext.sourceSummary.websiteAvailable
          ? websiteStatus
          : 'missing',
        lastAnalyzedAt: websiteAnalyzedAt?.toISOString() ?? null,
        warnings: this.unique(warningsInput.websiteWarnings ?? []),
      },
      instagram: {
        available: resolvedContext.sourceSummary.instagramAvailable,
        status: resolvedContext.sourceSummary.instagramAvailable
          ? instagramStatus
          : 'missing',
        lastAnalyzedAt: instagramAnalyzedAt?.toISOString() ?? null,
        warnings: this.unique(warningsInput.instagramWarnings ?? []),
      },
      manualTraining: {
        available: resolvedContext.sourceSummary.manualTrainingAvailable,
        status: resolvedContext.sourceSummary.manualTrainingAvailable
          ? manualStatus
          : 'missing',
        updatedAt: manualUpdatedAt?.toISOString() ?? null,
        warnings: this.unique(warningsInput.manualWarnings ?? []),
      },
    };
  }

  private buildConfidence(
    websiteConfidence: number | null,
    instagramConfidence: number | null,
    manualContext: ManualTrainingContext,
  ): ConfidenceJson {
    const manualCompletenessFields = [
      manualContext.products.length > 0,
      manualContext.faq.length > 0,
      manualContext.customRules.length > 0,
      manualContext.forbiddenResponses.length > 0,
      manualContext.handoffRules.length > 0,
    ];
    const manualConfidence = manualCompletenessFields.some(Boolean)
      ? Number(
          (
            manualCompletenessFields.filter(Boolean).length /
            manualCompletenessFields.length
          ).toFixed(2),
        )
      : null;

    const weighted = [
      {
        value: websiteConfidence,
        weight: 0.4,
      },
      {
        value: instagramConfidence,
        weight: 0.35,
      },
      {
        value: manualConfidence,
        weight: 0.25,
      },
    ].filter(
      (entry): entry is { value: number; weight: number } =>
        typeof entry.value === 'number',
    );

    const overall =
      weighted.length === 0
        ? 0
        : Number(
            (
              weighted.reduce(
                (total, entry) => total + entry.value * entry.weight,
                0,
              ) / weighted.reduce((total, entry) => total + entry.weight, 0)
            ).toFixed(2),
          );

    return {
      website:
        websiteConfidence !== null
          ? Number(websiteConfidence.toFixed(2))
          : null,
      instagram:
        instagramConfidence !== null
          ? Number(instagramConfidence.toFixed(2))
          : null,
      manualTraining: manualConfidence,
      overall,
    };
  }

  private extractManualTrainingContext(
    trainingSettings: {
      productsJson: Prisma.JsonValue | null;
      faqJson: Prisma.JsonValue | null;
      rulesJson: Prisma.JsonValue | null;
      forbiddenResponsesJson: Prisma.JsonValue | null;
      handoffRulesJson: Prisma.JsonValue | null;
    } | null,
  ): ManualTrainingContext {
    if (!trainingSettings) {
      return {
        products: [],
        faq: [],
        forbiddenResponses: [],
        handoffRules: [],
        customRules: [],
        toneHints: [],
        targetAudience: null,
        positioningHints: [],
        preferredSalesStyle: null,
        preferredTone: null,
      };
    }

    const rules = this.toObject(trainingSettings.rulesJson);
    const products = this.toObjectArray(trainingSettings.productsJson)
      .map((item) => ({
        name: this.pickString(item, ['name', 'title']) ?? '',
        summary:
          this.pickString(item, ['summary', 'description', 'value']) ?? '',
        pricePositioning:
          this.pickString(item, ['pricePositioning', 'price', 'segment']) ??
          null,
      }))
      .filter((item) => item.name.length > 0 || item.summary.length > 0)
      .map((item) => ({
        ...item,
        name: item.name || 'Untitled product',
      }));

    const faq = this.toObjectArray(trainingSettings.faqJson)
      .map((item) => ({
        question: this.pickString(item, ['question', 'q']) ?? '',
        answer: this.pickString(item, ['answer', 'a']) ?? '',
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0);

    return {
      products,
      faq,
      forbiddenResponses: this.toStringArray(
        trainingSettings.forbiddenResponsesJson,
      ),
      handoffRules: this.toStringArray(trainingSettings.handoffRulesJson),
      customRules: this.toStringArray(rules.customRules ?? rules.rules ?? null),
      toneHints: this.toStringArray(rules.toneHints ?? null),
      targetAudience:
        this.pickString(rules, ['targetAudience', 'audience']) ?? null,
      positioningHints: this.toStringArray(rules.positioningHints ?? null),
      preferredSalesStyle: this.toSalesStyle(
        this.pickString(rules, ['salesStyle', 'preferredSalesStyle']),
      ),
      preferredTone: this.pickString(rules, ['primaryTone', 'tone']),
    };
  }

  private stateFromDate(
    value: Date | null,
    staleThresholdDays: number,
  ): SourceStatusState {
    if (!value) {
      return 'missing';
    }

    const ageMs = Date.now() - value.getTime();
    const staleMs = staleThresholdDays * 24 * 60 * 60 * 1000;
    return ageMs > staleMs ? 'stale' : 'ready';
  }

  private parseResolvedContext(value: Prisma.JsonValue): ResolvedBrandContext {
    const object = this.toObject(value);
    return {
      brandName: this.readNullableString(object.brandName),
      toneProfile: {
        primaryTone: this.readNullableString(
          this.toObject(object.toneProfile).primaryTone,
        ),
        toneHints: this.toStringArray(
          this.toObject(object.toneProfile).toneHints,
        ),
        salesStyle: this.toSalesStyle(
          this.readNullableString(this.toObject(object.toneProfile).salesStyle),
        ),
      },
      audienceProfile: {
        targetAudience: this.readNullableString(
          this.toObject(object.audienceProfile).targetAudience,
        ),
        positioningHints: this.toStringArray(
          this.toObject(object.audienceProfile).positioningHints,
        ),
      },
      productKnowledge: this.toObjectArray(object.productKnowledge).map(
        (item) => ({
          name: this.pickString(item, ['name']) ?? 'Untitled product',
          summary: this.pickString(item, ['summary']) ?? '',
          pricePositioning: this.pickString(item, ['pricePositioning']),
        }),
      ),
      faq: this.toObjectArray(object.faq).map((item) => ({
        question: this.pickString(item, ['question']) ?? '',
        answer: this.pickString(item, ['answer']) ?? '',
      })),
      responseRules: {
        forbiddenResponses: this.toStringArray(
          this.toObject(object.responseRules).forbiddenResponses,
        ),
        handoffRules: this.toStringArray(
          this.toObject(object.responseRules).handoffRules,
        ),
        customRules: this.toStringArray(
          this.toObject(object.responseRules).customRules,
        ),
      },
      sourceSummary: {
        websiteAvailable: Boolean(
          this.toObject(object.sourceSummary).websiteAvailable,
        ),
        instagramAvailable: Boolean(
          this.toObject(object.sourceSummary).instagramAvailable,
        ),
        manualTrainingAvailable: Boolean(
          this.toObject(object.sourceSummary).manualTrainingAvailable,
        ),
      },
    };
  }

  private parseSourceStatus(value: Prisma.JsonValue): SourceStatusJson {
    const object = this.toObject(value);
    const website = this.toObject(object.website);
    const instagram = this.toObject(object.instagram);
    const manualTraining = this.toObject(object.manualTraining);

    return {
      website: {
        available: Boolean(website.available),
        status: this.toStatus(website.status),
        lastAnalyzedAt: this.readNullableString(website.lastAnalyzedAt),
        warnings: this.toStringArray(website.warnings),
      },
      instagram: {
        available: Boolean(instagram.available),
        status: this.toStatus(instagram.status),
        lastAnalyzedAt: this.readNullableString(instagram.lastAnalyzedAt),
        warnings: this.toStringArray(instagram.warnings),
      },
      manualTraining: {
        available: Boolean(manualTraining.available),
        status: this.toStatus(manualTraining.status),
        updatedAt: this.readNullableString(manualTraining.updatedAt),
        warnings: this.toStringArray(manualTraining.warnings),
      },
    };
  }

  private parseConfidence(value: Prisma.JsonValue): ConfidenceJson {
    const object = this.toObject(value);
    return {
      website: this.readNullableNumber(object.website),
      instagram: this.readNullableNumber(object.instagram),
      manualTraining: this.readNullableNumber(object.manualTraining),
      overall: this.readNullableNumber(object.overall) ?? 0,
    };
  }

  private toWebsiteSignals(value: Prisma.JsonValue | null): WebsiteSignals {
    const object = this.toObject(value);
    return {
      brandName: this.readNullableString(object.brandName),
      tagline: this.readNullableString(object.tagline),
      metaTitle: this.readNullableString(object.metaTitle),
      metaDescription: this.readNullableString(object.metaDescription),
      primaryKeywords: this.toStringArray(object.primaryKeywords),
      ctaPatterns: this.toStringArray(object.ctaPatterns),
      toneHints: this.toStringArray(object.toneHints),
      positioningHints: this.toStringArray(object.positioningHints),
      premiumPerception: this.toSignalLevel(object.premiumPerception),
      campaignAggressiveness: this.toSignalLevel(object.campaignAggressiveness),
      productFocusHints: this.toStringArray(object.productFocusHints),
    };
  }

  private toInstagramSignals(value: Prisma.JsonValue | null): InstagramSignals {
    const object = this.toObject(value);
    return {
      username: this.readNullableString(object.username),
      bioSummary: this.readNullableString(object.bioSummary),
      toneHints: this.toStringArray(object.toneHints),
      ctaPatterns: this.toStringArray(object.ctaPatterns),
      hashtagPatterns: this.toStringArray(object.hashtagPatterns),
      contentStyleHints: this.toStringArray(object.contentStyleHints),
      salesStyle: this.toSalesStyle(this.readNullableString(object.salesStyle)),
      emojiDensity: this.toSignalLevel(object.emojiDensity),
      consistencyScore: this.readNullableNumber(object.consistencyScore),
    };
  }

  private toObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private toObjectArray(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item),
      )
      .slice(0, 100);
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .flatMap((item) => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          return trimmed.length > 0 ? [trimmed] : [];
        }
        return [];
      })
      .slice(0, 100);
  }

  private readNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private readNullableNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return null;
  }

  private pickString(
    object: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = object[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private toSignalLevel(value: unknown): 'low' | 'medium' | 'high' | null {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }

    return null;
  }

  private toSalesStyle(
    value: string | null,
  ): 'soft' | 'balanced' | 'aggressive' | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'soft') {
      return 'soft';
    }
    if (normalized === 'balanced') {
      return 'balanced';
    }
    if (normalized === 'aggressive') {
      return 'aggressive';
    }

    return null;
  }

  private toStatus(value: unknown): SourceStatusState {
    if (value === 'ready' || value === 'missing' || value === 'stale') {
      return value;
    }

    return 'missing';
  }

  private hasWebsiteSignals(signals: WebsiteSignals): boolean {
    return (
      signals.brandName !== null ||
      signals.tagline !== null ||
      signals.primaryKeywords.length > 0 ||
      signals.toneHints.length > 0 ||
      signals.productFocusHints.length > 0
    );
  }

  private hasInstagramSignals(signals: InstagramSignals): boolean {
    return (
      signals.username !== null ||
      signals.bioSummary !== null ||
      signals.hashtagPatterns.length > 0 ||
      signals.ctaPatterns.length > 0 ||
      signals.toneHints.length > 0
    );
  }

  private detectFallbackTone(
    websiteSignals: WebsiteSignals,
    instagramSignals: InstagramSignals,
  ): string | null {
    if (websiteSignals.premiumPerception === 'high') {
      return 'premium';
    }
    if (
      instagramSignals.emojiDensity === 'high' ||
      instagramSignals.emojiDensity === 'medium'
    ) {
      return 'friendly';
    }

    return null;
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }
}
