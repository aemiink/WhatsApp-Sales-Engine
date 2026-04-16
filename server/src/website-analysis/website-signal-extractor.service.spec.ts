import { ParsedWebsitePage } from './types/website-analysis.types';
import { WebsiteSignalExtractorService } from './website-signal-extractor.service';

describe('WebsiteSignalExtractorService', () => {
  it('extracts normalized website signals and confidence', () => {
    const service = new WebsiteSignalExtractorService();

    const pages: ParsedWebsitePage[] = [
      {
        url: 'https://example.com/',
        title: 'Acme Studio | Premium Home Decor',
        metaDescription:
          'Premium handcrafted home decor for modern living spaces.',
        metaKeywords: ['home decor', 'premium', 'collection'],
        headings: ['Handcrafted Premium Decor', 'Shop New Collection'],
        textContent:
          'Discover premium handcrafted home decor. Buy now and contact us for custom designs.',
        links: ['/about', '/shop'],
        ctaFragments: ['buy now', 'contact us', 'shop now'],
      },
      {
        url: 'https://example.com/about',
        title: 'About Acme Studio',
        metaDescription: 'Our mission is quality and trust.',
        metaKeywords: ['about', 'quality'],
        headings: ['Our Story'],
        textContent:
          'Acme Studio is a trusted boutique brand focused on quality craftsmanship.',
        links: ['/'],
        ctaFragments: ['learn more'],
      },
    ];

    const result = service.extract(pages);

    expect(result.signals.brandName).toBe('Acme Studio');
    expect(result.signals.metaDescription).toContain('Premium');
    expect(result.signals.primaryKeywords.length).toBeGreaterThan(0);
    expect(result.signals.ctaPatterns).toContain('buy now');
    expect(result.signals.premiumPerception).toBe('medium');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.warnings).toEqual([]);
  });
});
