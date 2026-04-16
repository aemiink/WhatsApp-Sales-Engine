import { Injectable } from '@nestjs/common';
import {
  ParsedWebsitePage,
  WebsiteExtractionResult,
  WebsiteSignals,
} from './types/website-analysis.types';

const STOPWORDS = new Set([
  've',
  'ile',
  'bir',
  'bu',
  'için',
  'daha',
  'çok',
  'gibi',
  'olan',
  'olarak',
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'your',
  'you',
  'our',
  'to',
  'are',
  'was',
  'will',
  'can',
  'www',
  'com',
]);

const PREMIUM_HINTS = [
  'premium',
  'luxury',
  'exclusive',
  'özel',
  'lüks',
  'kalite',
  'quality',
  'designer',
];

const FRIENDLY_HINTS = [
  'samimi',
  'dostça',
  'friendly',
  'warm',
  'community',
  'together',
  'memnuniyet',
];

const TRUST_HINTS = [
  'güven',
  'güvenilir',
  'trusted',
  'official',
  'sertifika',
  'garanti',
  'warranty',
];

const PRODUCT_HINTS = [
  'ürün',
  'product',
  'koleksiyon',
  'collection',
  'hizmet',
  'service',
  'paket',
  'plan',
  'model',
  'kategori',
  'category',
];

const CTA_URGENT_HINTS = [
  'hemen',
  'now',
  'limited',
  'son fırsat',
  'kaçırma',
  'bugün',
  'indirim',
  'kampanya',
];

@Injectable()
export class WebsiteSignalExtractorService {
  extract(pages: ParsedWebsitePage[]): WebsiteExtractionResult {
    const warnings: string[] = [];
    const htmlPages = pages.filter((page) => page.textContent.length > 0);

    if (htmlPages.length === 0) {
      warnings.push('No parseable HTML content found for website analysis.');
      return {
        signals: this.emptySignals(),
        confidence: 0,
        warnings,
      };
    }

    const combinedText = htmlPages.map((page) => page.textContent).join(' ');
    const keywords = this.extractPrimaryKeywords(htmlPages);
    const ctaPatterns = this.unique(
      htmlPages.flatMap((page) => page.ctaFragments.map((value) => value)),
    );
    const toneHints = this.unique([
      ...this.detectToneHints(combinedText, PREMIUM_HINTS, 'premium'),
      ...this.detectToneHints(combinedText, FRIENDLY_HINTS, 'friendly'),
      ...this.detectToneHints(combinedText, TRUST_HINTS, 'trustworthy'),
    ]);
    const positioningHints = this.extractPositioningHints(combinedText);
    const productFocusHints = this.extractProductFocusHints(htmlPages);

    const brandName = this.pickBrandName(htmlPages);
    const tagline = this.pickTagline(htmlPages, brandName);
    const metaTitle =
      htmlPages.find((page) => page.title !== null)?.title ?? null;
    const metaDescription =
      htmlPages.find((page) => page.metaDescription !== null)
        ?.metaDescription ?? null;

    const premiumScore = this.countHints(combinedText, PREMIUM_HINTS);
    const urgentScore =
      this.countHints(combinedText, CTA_URGENT_HINTS) + ctaPatterns.length;

    const signals: WebsiteSignals = {
      brandName,
      tagline,
      metaTitle,
      metaDescription,
      primaryKeywords: keywords,
      ctaPatterns,
      toneHints,
      positioningHints,
      premiumPerception: this.levelFromScore(premiumScore, 1, 3),
      campaignAggressiveness: this.levelFromScore(urgentScore, 2, 6),
      productFocusHints,
    };

    const confidence = this.calculateConfidence(signals, htmlPages.length);

    return {
      signals,
      confidence,
      warnings,
    };
  }

  private emptySignals(): WebsiteSignals {
    return {
      brandName: null,
      tagline: null,
      metaTitle: null,
      metaDescription: null,
      primaryKeywords: [],
      ctaPatterns: [],
      toneHints: [],
      positioningHints: [],
      premiumPerception: null,
      campaignAggressiveness: null,
      productFocusHints: [],
    };
  }

  private pickBrandName(pages: ParsedWebsitePage[]): string | null {
    const firstTitle = pages.find((page) => page.title)?.title;
    if (firstTitle) {
      return this.normalizeBrandName(firstTitle);
    }

    const firstHeading = pages.find((page) => page.headings.length > 0)
      ?.headings[0];
    return firstHeading ?? null;
  }

  private normalizeBrandName(title: string): string {
    return (
      title
        .split(/[|•·–—-]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 1)[0] ?? title.trim()
    );
  }

  private pickTagline(
    pages: ParsedWebsitePage[],
    brandName: string | null,
  ): string | null {
    for (const page of pages) {
      for (const heading of page.headings) {
        if (heading.length < 10 || heading.length > 140) {
          continue;
        }
        if (brandName && heading.toLowerCase() === brandName.toLowerCase()) {
          continue;
        }

        return heading;
      }
    }

    return null;
  }

  private extractPrimaryKeywords(pages: ParsedWebsitePage[]): string[] {
    const tokens: string[] = [];

    for (const page of pages) {
      tokens.push(...page.metaKeywords);
      tokens.push(...this.tokenize(page.title ?? ''));
      tokens.push(...this.tokenize(page.metaDescription ?? ''));
      tokens.push(...this.tokenize(page.headings.join(' ')));
    }

    const frequency = new Map<string, number>();
    for (const token of tokens) {
      if (token.length < 3 || STOPWORDS.has(token)) {
        continue;
      }
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }

    return Array.from(frequency.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([keyword]) => keyword);
  }

  private detectToneHints(
    text: string,
    hintWords: string[],
    label: string,
  ): string[] {
    const normalized = text.toLowerCase();
    return hintWords.some((hint) => normalized.includes(hint)) ? [label] : [];
  }

  private extractPositioningHints(text: string): string[] {
    const normalized = text.toLowerCase();
    const hints: string[] = [];

    if (
      normalized.includes('premium') ||
      normalized.includes('lüks') ||
      normalized.includes('exclusive')
    ) {
      hints.push('premium-positioning');
    }
    if (
      normalized.includes('uygun fiyat') ||
      normalized.includes('affordable') ||
      normalized.includes('price')
    ) {
      hints.push('value-positioning');
    }
    if (
      normalized.includes('hızlı') ||
      normalized.includes('fast') ||
      normalized.includes('same day')
    ) {
      hints.push('speed-positioning');
    }
    if (
      normalized.includes('özel üretim') ||
      normalized.includes('custom') ||
      normalized.includes('kişiselle')
    ) {
      hints.push('custom-positioning');
    }

    return hints;
  }

  private extractProductFocusHints(pages: ParsedWebsitePage[]): string[] {
    const matches = new Set<string>();

    for (const page of pages) {
      for (const heading of page.headings) {
        const normalized = heading.toLowerCase();
        if (PRODUCT_HINTS.some((hint) => normalized.includes(hint))) {
          matches.add(heading);
        }
      }
    }

    return Array.from(matches).slice(0, 10);
  }

  private countHints(text: string, hints: string[]): number {
    const normalized = text.toLowerCase();
    return hints.reduce((total, hint) => {
      return total + (normalized.includes(hint) ? 1 : 0);
    }, 0);
  }

  private levelFromScore(
    score: number,
    mediumThreshold: number,
    highThreshold: number,
  ): 'low' | 'medium' | 'high' | null {
    if (score <= 0) {
      return null;
    }
    if (score >= highThreshold) {
      return 'high';
    }
    if (score >= mediumThreshold) {
      return 'medium';
    }
    return 'low';
  }

  private calculateConfidence(
    signals: WebsiteSignals,
    pageCount: number,
  ): number {
    let score = 0;

    if (signals.brandName) {
      score += 0.15;
    }
    if (signals.tagline) {
      score += 0.1;
    }
    if (signals.metaDescription) {
      score += 0.1;
    }
    if (signals.primaryKeywords.length > 0) {
      score += 0.2;
    }
    if (signals.ctaPatterns.length > 0) {
      score += 0.15;
    }
    if (signals.toneHints.length > 0) {
      score += 0.1;
    }
    if (signals.productFocusHints.length > 0) {
      score += 0.1;
    }
    if (pageCount > 1) {
      score += 0.1;
    }

    return Number(Math.min(1, score).toFixed(2));
  }

  private tokenize(input: string): string[] {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9ığüşöçİĞÜŞÖÇ\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }
}
