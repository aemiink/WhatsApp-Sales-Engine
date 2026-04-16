import { Injectable, Logger } from '@nestjs/common';
import {
  FetchedWebsitePage,
  WebsiteFetchResult,
} from './types/website-analysis.types';

const CANDIDATE_PATH_HINTS = [
  'about',
  'hakkimizda',
  'hakkimizda',
  'company',
  'urun',
  'product',
  'products',
  'shop',
  'collection',
  'collections',
  'category',
  'services',
  'hizmet',
];

@Injectable()
export class WebsiteFetcherService {
  private readonly logger = new Logger(WebsiteFetcherService.name);
  private readonly fetchTimeoutMs = 8000;
  private readonly maxPages = 4;

  async fetchWebsite(websiteUrl: string): Promise<WebsiteFetchResult> {
    const normalizedRootUrl = this.normalizeRootUrl(websiteUrl);
    const rootPage = await this.fetchSinglePage(normalizedRootUrl);

    const warnings: string[] = [];
    if (rootPage.error) {
      warnings.push(
        `Website root page could not be fetched: ${rootPage.error}`,
      );
      return {
        rootUrl: normalizedRootUrl,
        pages: [rootPage],
        warnings,
      };
    }

    const linkCandidates = this.extractCandidateLinks(
      normalizedRootUrl,
      rootPage.html,
    );
    const pages: FetchedWebsitePage[] = [rootPage];

    for (const link of linkCandidates.slice(0, this.maxPages - 1)) {
      const fetched = await this.fetchSinglePage(link);
      pages.push(fetched);

      if (fetched.error) {
        warnings.push(`Failed to fetch ${link}: ${fetched.error}`);
      }
    }

    this.logger.log(
      `Website fetched root=${normalizedRootUrl} pages=${pages.length}`,
    );

    return {
      rootUrl: normalizedRootUrl,
      pages,
      warnings,
    };
  }

  private normalizeRootUrl(websiteUrl: string): string {
    let parsed: URL;
    try {
      parsed = new URL(websiteUrl.trim());
    } catch {
      throw new Error('Invalid website URL format.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Website URL must start with http:// or https://');
    }

    parsed.hash = '';
    parsed.search = '';
    if (!parsed.pathname || parsed.pathname === '') {
      parsed.pathname = '/';
    }

    return parsed.toString();
  }

  private extractCandidateLinks(
    rootUrl: string,
    rootHtml: string | null,
  ): string[] {
    if (!rootHtml) {
      return [];
    }

    const root = new URL(rootUrl);
    const links = new Set<string>();
    const hrefRegex = /href=["']([^"'#]+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(rootHtml)) !== null) {
      const href = match[1]?.trim();
      if (!href) {
        continue;
      }

      try {
        const normalized = new URL(href, root).toString();
        const parsed = new URL(normalized);

        if (parsed.hostname !== root.hostname) {
          continue;
        }

        if (
          !CANDIDATE_PATH_HINTS.some((hint) =>
            parsed.pathname.toLowerCase().includes(hint),
          )
        ) {
          continue;
        }

        parsed.hash = '';
        parsed.search = '';
        links.add(parsed.toString());
      } catch {
        continue;
      }
    }

    return Array.from(links).sort((left, right) => {
      const leftScore = this.scorePath(left);
      const rightScore = this.scorePath(right);
      return rightScore - leftScore;
    });
  }

  private scorePath(url: string): number {
    const path = new URL(url).pathname.toLowerCase();
    let score = 0;

    if (path.includes('about') || path.includes('hakkimizda')) {
      score += 3;
    }
    if (
      path.includes('product') ||
      path.includes('urun') ||
      path.includes('shop')
    ) {
      score += 2;
    }
    if (path.includes('service') || path.includes('hizmet')) {
      score += 1;
    }

    return score;
  }

  private async fetchSinglePage(url: string): Promise<FetchedWebsitePage> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.fetchTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'WhatsApp-Sales-Engine/1.0 (+brand-context-analysis)',
          accept: 'text/html,application/xhtml+xml',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/html')) {
        return {
          url,
          status: response.status,
          html: null,
          error: `Non-HTML response (${contentType ?? 'unknown content type'})`,
        };
      }

      const html = await response.text();
      return {
        url,
        status: response.status,
        html,
        error: response.ok ? null : `HTTP ${response.status}`,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown fetch error';
      return {
        url,
        status: null,
        html: null,
        error: message,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
