export interface InstagramPost {
  caption: string;
  hashtags: string[];
  raw: unknown;
}

export interface FetchedInstagramData {
  instagramHandle: string | null;
  profileJson: Record<string, unknown>;
  postsJson: InstagramPost[];
  warnings: string[];
}

export type SalesStyle = 'soft' | 'balanced' | 'aggressive' | null;
export type EmojiDensity = 'low' | 'medium' | 'high' | null;

export interface InstagramSignals {
  username: string | null;
  bioSummary: string | null;
  toneHints: string[];
  ctaPatterns: string[];
  hashtagPatterns: string[];
  contentStyleHints: string[];
  salesStyle: SalesStyle;
  emojiDensity: EmojiDensity;
  consistencyScore: number | null;
}

export interface InstagramExtractionResult {
  signals: InstagramSignals;
  confidence: number;
  warnings: string[];
}
