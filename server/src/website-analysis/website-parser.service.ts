import { Injectable } from '@nestjs/common';
import {
  FetchedWebsitePage,
  ParsedWebsitePage,
} from './types/website-analysis.types';

const CTA_PATTERNS = [
  'hemen al',
  'satın al',
  'teklif al',
  'iletişime geç',
  'bize ulaşın',
  'whatsapp',
  'book now',
  'buy now',
  'get quote',
  'contact us',
  'shop now',
  'learn more',
];

@Injectable()
export class WebsiteParserService {
  parsePages(pages: FetchedWebsitePage[]): ParsedWebsitePage[] {
    return pages.map((page) => this.parseSinglePage(page));
  }

  private parseSinglePage(page: FetchedWebsitePage): ParsedWebsitePage {
    if (!page.html) {
      return {
        url: page.url,
        title: null,
        metaDescription: null,
        metaKeywords: [],
        headings: [],
        textContent: '',
        links: [],
        ctaFragments: [],
      };
    }

    const html = page.html;
    const textContent = this.extractText(html);

    return {
      url: page.url,
      title: this.extractTagContent(html, 'title'),
      metaDescription: this.extractMetaContent(html, 'description'),
      metaKeywords: this.extractMetaKeywords(
        this.extractMetaContent(html, 'keywords'),
      ),
      headings: this.extractHeadings(html),
      textContent,
      links: this.extractLinks(html),
      ctaFragments: this.extractCtaFragments(textContent),
    };
  }

  private extractTagContent(html: string, tagName: string): string | null {
    const regex = new RegExp(
      `<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
      'i',
    );
    const match = regex.exec(html);
    if (!match?.[1]) {
      return null;
    }

    return this.normalizeText(this.stripTags(match[1]));
  }

  private extractMetaContent(html: string, name: string): string | null {
    const metaRegex = new RegExp(
      `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      'i',
    );
    const propertyRegex = new RegExp(
      `<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      'i',
    );

    const match = metaRegex.exec(html) ?? propertyRegex.exec(html);
    if (!match?.[1]) {
      return null;
    }

    return this.normalizeText(match[1]);
  }

  private extractMetaKeywords(metaKeywords: string | null): string[] {
    if (!metaKeywords) {
      return [];
    }

    return metaKeywords
      .split(',')
      .map((value) => this.normalizeText(value))
      .filter((value) => value.length > 1)
      .slice(0, 15);
  }

  private extractHeadings(html: string): string[] {
    const headings: string[] = [];
    const regex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const heading = this.normalizeText(this.stripTags(match[1] ?? ''));
      if (heading.length > 1) {
        headings.push(heading);
      }
    }

    return headings.slice(0, 20);
  }

  private extractText(html: string): string {
    const withoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

    return this.normalizeText(this.stripTags(withoutScripts));
  }

  private extractLinks(html: string): string[] {
    const links = new Set<string>();
    const regex = /href=["']([^"'#]+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const href = match[1]?.trim();
      if (!href) {
        continue;
      }

      links.add(href);
      if (links.size >= 50) {
        break;
      }
    }

    return Array.from(links);
  }

  private extractCtaFragments(text: string): string[] {
    const normalized = text.toLowerCase();
    return CTA_PATTERNS.filter((pattern) => normalized.includes(pattern));
  }

  private stripTags(input: string): string {
    return input.replace(/<[^>]+>/g, ' ');
  }

  private normalizeText(input: string): string {
    return input
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
