export interface FetchedWebsitePage {
  url: string;
  status: number | null;
  html: string | null;
  error: string | null;
}

export interface WebsiteFetchResult {
  rootUrl: string;
  pages: FetchedWebsitePage[];
  warnings: string[];
}

export interface ParsedWebsitePage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  headings: string[];
  textContent: string;
  links: string[];
  ctaFragments: string[];
}

export type SignalLevel = 'low' | 'medium' | 'high' | null;

export interface WebsiteSignals {
  brandName: string | null;
  tagline: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  primaryKeywords: string[];
  ctaPatterns: string[];
  toneHints: string[];
  positioningHints: string[];
  premiumPerception: SignalLevel;
  campaignAggressiveness: SignalLevel;
  productFocusHints: string[];
}

export interface WebsiteExtractionResult {
  signals: WebsiteSignals;
  confidence: number;
  warnings: string[];
}
