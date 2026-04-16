import { BrandContextResolverService } from './brand-context-resolver.service';

describe('BrandContextResolverService', () => {
  it('merges website, instagram, and manual training into resolved context', async () => {
    const prismaMock = {
      brandContext: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'bc-1' }),
      },
      websiteAnalysisSnapshot: {
        findFirst: jest.fn().mockResolvedValue({
          extractedSignalsJson: {
            brandName: 'Acme Studio',
            toneHints: ['premium'],
            positioningHints: ['premium-positioning'],
            productFocusHints: ['Signature Candle'],
          },
          confidence: 0.84,
          createdAt: new Date('2026-04-10T10:00:00.000Z'),
        }),
      },
      instagramAnalysisSnapshot: {
        findFirst: jest.fn().mockResolvedValue({
          extractedSignalsJson: {
            username: 'acmestudio',
            toneHints: ['soft-friendly'],
            salesStyle: 'balanced',
            hashtagPatterns: ['#decor'],
          },
          confidence: 0.66,
          createdAt: new Date('2026-04-12T09:00:00.000Z'),
        }),
      },
      trainingSetting: {
        findUnique: jest.fn().mockResolvedValue({
          productsJson: [
            {
              name: 'Signature Candle',
              summary: 'Natural soy wax candle',
              pricePositioning: 'premium',
            },
          ],
          faqJson: [
            {
              question: 'Kargo süresi nedir?',
              answer: '2-3 iş günü.',
            },
          ],
          rulesJson: {
            tone: 'consultative',
            targetAudience: 'Modern home owners',
            customRules: ['short and clear sentences'],
          },
          forbiddenResponsesJson: ['Kesin teslim tarihi veremezsin'],
          handoffRulesJson: ['Ödeme problemi olursa temsilciye aktar'],
          updatedAt: new Date('2026-04-15T08:00:00.000Z'),
        }),
      },
    };

    const service = new BrandContextResolverService(prismaMock as never);
    const result = await service.resolveForWorkspace('ws-1');

    expect(result.resolvedContext.brandName).toBe('Acme Studio');
    expect(result.resolvedContext.toneProfile.primaryTone).toBe('consultative');
    expect(result.resolvedContext.toneProfile.salesStyle).toBe('balanced');
    expect(result.resolvedContext.productKnowledge[0]?.name).toBe(
      'Signature Candle',
    );
    expect(result.resolvedContext.faq).toHaveLength(1);
    expect(result.sourceStatus.website.status).toBe('ready');
    expect(result.sourceStatus.instagram.status).toBe('ready');
    expect(result.sourceStatus.manualTraining.status).toBe('ready');
    expect(result.confidence.overall).toBeGreaterThan(0.5);
    expect(prismaMock.brandContext.upsert).toHaveBeenCalledTimes(1);
  });

  it('returns missing source status when source data is absent', async () => {
    const prismaMock = {
      brandContext: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'bc-2' }),
      },
      websiteAnalysisSnapshot: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      instagramAnalysisSnapshot: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      trainingSetting: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new BrandContextResolverService(prismaMock as never);
    const result = await service.resolveForWorkspace('ws-1');

    expect(result.sourceStatus.website.status).toBe('missing');
    expect(result.sourceStatus.instagram.status).toBe('missing');
    expect(result.sourceStatus.manualTraining.status).toBe('missing');
    expect(result.confidence.overall).toBe(0);
  });
});
