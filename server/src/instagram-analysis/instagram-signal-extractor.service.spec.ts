import { FetchedInstagramData } from './types/instagram-analysis.types';
import { InstagramSignalExtractorService } from './instagram-signal-extractor.service';

describe('InstagramSignalExtractorService', () => {
  it('extracts instagram communication signals', () => {
    const service = new InstagramSignalExtractorService();

    const input: FetchedInstagramData = {
      instagramHandle: 'acmestudio',
      profileJson: {
        bio: 'Premium handcrafted decor. DM us for custom orders.',
      },
      postsJson: [
        {
          caption:
            'New collection is live. Buy now from link in bio. #decor #premium',
          hashtags: ['#decor', '#premium'],
          raw: {},
        },
        {
          caption:
            'Limited launch week offer. DM us for details. #homestyle #design',
          hashtags: ['#homestyle', '#design'],
          raw: {},
        },
      ],
      warnings: [],
    };

    const result = service.extract(input);

    expect(result.signals.username).toBe('acmestudio');
    expect(result.signals.bioSummary).toContain('Premium');
    expect(result.signals.ctaPatterns.length).toBeGreaterThan(0);
    expect(result.signals.hashtagPatterns).toContain('#decor');
    expect(result.signals.salesStyle).toBe('aggressive');
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.warnings).toEqual([]);
  });
});
