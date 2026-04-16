import { Injectable } from '@nestjs/common';
import {
  FetchedInstagramData,
  InstagramExtractionResult,
  InstagramSignals,
  SalesStyle,
} from './types/instagram-analysis.types';

const CTA_PATTERNS = [
  'link in bio',
  'dm us',
  'write us',
  'sipariş',
  'hemen',
  'buy now',
  'book now',
  'limited',
  'tıkla',
  'iletişime geç',
];

const SOFT_TONE_HINTS = ['samimi', 'friendly', 'community', 'beraber'];
const AGGRESSIVE_TONE_HINTS = ['now', 'limited', 'kaçırma', 'hemen'];

@Injectable()
export class InstagramSignalExtractorService {
  extract(input: FetchedInstagramData): InstagramExtractionResult {
    const warnings = [...input.warnings];
    const captions = input.postsJson.map((post) => post.caption);
    const combinedText = captions.join(' ');
    const bioSummary = this.extractBioSummary(input.profileJson);

    if (captions.length === 0 && !bioSummary) {
      warnings.push(
        'No Instagram profile bio or captions were available for robust analysis.',
      );
    }

    const hashtagPatterns = this.unique(
      input.postsJson.flatMap((post) => post.hashtags),
    ).slice(0, 20);
    const ctaPatterns = CTA_PATTERNS.filter((pattern) =>
      combinedText.toLowerCase().includes(pattern),
    );
    const emojiDensity = this.detectEmojiDensity(combinedText);
    const toneHints = this.detectToneHints(combinedText, bioSummary);
    const contentStyleHints = this.detectContentStyleHints(
      captions,
      hashtagPatterns,
      emojiDensity,
    );
    const salesStyle = this.detectSalesStyle(ctaPatterns, captions.length);
    const consistencyScore = this.calculateConsistencyScore(
      hashtagPatterns,
      input.postsJson.length,
    );

    const signals: InstagramSignals = {
      username: input.instagramHandle,
      bioSummary,
      toneHints,
      ctaPatterns,
      hashtagPatterns,
      contentStyleHints,
      salesStyle,
      emojiDensity,
      consistencyScore,
    };

    return {
      signals,
      confidence: this.calculateConfidence(signals, input.postsJson.length),
      warnings,
    };
  }

  private detectToneHints(
    combinedText: string,
    bioSummary: string | null,
  ): string[] {
    const normalized = `${combinedText} ${bioSummary ?? ''}`.toLowerCase();
    const hints: string[] = [];

    if (SOFT_TONE_HINTS.some((hint) => normalized.includes(hint))) {
      hints.push('soft-friendly');
    }
    if (AGGRESSIVE_TONE_HINTS.some((hint) => normalized.includes(hint))) {
      hints.push('campaign-driven');
    }
    if (
      normalized.includes('premium') ||
      normalized.includes('exclusive') ||
      normalized.includes('lüks')
    ) {
      hints.push('premium');
    }

    if (
      normalized.includes('eğitim') ||
      normalized.includes('tips') ||
      normalized.includes('öneri')
    ) {
      hints.push('educational');
    }

    return hints;
  }

  private detectContentStyleHints(
    captions: string[],
    hashtags: string[],
    emojiDensity: InstagramSignals['emojiDensity'],
  ): string[] {
    const hints: string[] = [];
    const averageCaptionLength =
      captions.length === 0
        ? 0
        : captions.reduce((total, caption) => total + caption.length, 0) /
          captions.length;

    if (hashtags.length > 5) {
      hints.push('hashtag-heavy');
    } else if (hashtags.length > 0) {
      hints.push('hashtag-balanced');
    }

    if (averageCaptionLength > 220) {
      hints.push('long-form-caption');
    } else if (averageCaptionLength > 0) {
      hints.push('short-form-caption');
    }

    if (emojiDensity === 'high') {
      hints.push('emoji-heavy');
    } else if (emojiDensity === 'medium') {
      hints.push('emoji-balanced');
    }

    return hints;
  }

  private detectSalesStyle(
    ctaPatterns: string[],
    postCount: number,
  ): SalesStyle {
    if (postCount === 0 || ctaPatterns.length === 0) {
      return postCount === 0 ? null : 'soft';
    }

    const ratio = ctaPatterns.length / Math.max(1, postCount);
    if (ratio >= 0.45) {
      return 'aggressive';
    }
    if (ratio >= 0.2) {
      return 'balanced';
    }

    return 'soft';
  }

  private detectEmojiDensity(text: string): InstagramSignals['emojiDensity'] {
    if (text.length === 0) {
      return null;
    }

    const emojiCount = (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
    const density = emojiCount / text.length;
    if (density >= 0.06) {
      return 'high';
    }
    if (density >= 0.02) {
      return 'medium';
    }
    if (density > 0) {
      return 'low';
    }

    return null;
  }

  private calculateConsistencyScore(
    hashtags: string[],
    postCount: number,
  ): number | null {
    if (postCount === 0) {
      return null;
    }

    if (hashtags.length === 0) {
      return Number((0.3).toFixed(2));
    }

    const normalized = Math.min(
      1,
      hashtags.length / Math.max(1, postCount * 2),
    );
    return Number((0.4 + normalized * 0.6).toFixed(2));
  }

  private calculateConfidence(
    signals: InstagramSignals,
    postCount: number,
  ): number {
    let score = 0;
    if (signals.username) {
      score += 0.2;
    }
    if (signals.bioSummary) {
      score += 0.15;
    }
    if (postCount >= 10) {
      score += 0.3;
    } else if (postCount > 0) {
      score += 0.15;
    }
    if (signals.hashtagPatterns.length > 0) {
      score += 0.15;
    }
    if (signals.ctaPatterns.length > 0) {
      score += 0.1;
    }
    if (signals.toneHints.length > 0) {
      score += 0.1;
    }

    return Number(Math.min(1, score).toFixed(2));
  }

  private extractBioSummary(
    profileJson: Record<string, unknown>,
  ): string | null {
    const bio = profileJson.bio;
    if (typeof bio === 'string' && bio.trim().length > 0) {
      return bio.trim();
    }

    return null;
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }
}
