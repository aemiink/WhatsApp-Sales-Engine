import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
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
  private readonly hostnameSafetyCache = new Map<string, true>();

  constructor(private readonly appConfigService: AppConfigService) {}

  private get fetchTimeoutMs(): number {
    return this.appConfigService.websiteFetchTimeoutMs ?? 8000;
  }

  private get maxPages(): number {
    return this.appConfigService.websiteFetchMaxPages ?? 4;
  }

  private get maxResponseBytes(): number {
    return this.appConfigService.websiteFetchMaxResponseBytes ?? 500_000;
  }

  async fetchWebsite(websiteUrl: string): Promise<WebsiteFetchResult> {
    const normalizedRootUrl = await this.normalizeRootUrl(websiteUrl);
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

  private async normalizeRootUrl(websiteUrl: string): Promise<string> {
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

    await this.assertPublicHttpTarget(parsed);

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
    const parsedUrl = new URL(url);
    await this.assertPublicHttpTarget(parsedUrl);

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

      const { text: html, truncated } = await this.readResponseTextWithLimit(
        response,
        this.maxResponseBytes,
      );
      const overLimitError = truncated
        ? `HTML response exceeded ${this.maxResponseBytes} bytes and was truncated`
        : null;

      return {
        url,
        status: response.status,
        html,
        error: !response.ok
          ? `HTTP ${response.status}`
          : (overLimitError ?? null),
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

  private async readResponseTextWithLimit(
    response: Response,
    maxBytes: number,
  ): Promise<{ text: string; truncated: boolean }> {
    const body = response.body;
    if (!body) {
      const text = await response.text();
      const bufferSize = Buffer.byteLength(text, 'utf8');
      if (bufferSize <= maxBytes) {
        return {
          text,
          truncated: false,
        };
      }

      return {
        text: text.slice(0, maxBytes),
        truncated: true,
      };
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let totalBytes = 0;
    let content = '';
    let truncated = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      const remaining = maxBytes - totalBytes;
      if (remaining <= 0) {
        truncated = true;
        await reader.cancel();
        break;
      }

      if (value.byteLength > remaining) {
        content += decoder.decode(value.subarray(0, remaining), {
          stream: true,
        });
        truncated = true;
        await reader.cancel();
        break;
      }

      totalBytes += value.byteLength;
      content += decoder.decode(value, { stream: true });
    }

    content += decoder.decode();

    return {
      text: content,
      truncated,
    };
  }

  private async assertPublicHttpTarget(url: URL): Promise<void> {
    const hostname = url.hostname.trim().toLowerCase();
    if (this.hostnameSafetyCache.has(hostname)) {
      return;
    }

    if (this.isBlockedHostname(hostname)) {
      throw new Error(
        'Website URL must target a public host. Local/private hosts are blocked.',
      );
    }

    const hostIpVersion = isIP(hostname);
    if (hostIpVersion > 0 && this.isPrivateIp(hostname)) {
      throw new Error(
        'Website URL resolves to private network IP and cannot be fetched.',
      );
    }

    let records: Array<{ address: string }>;
    try {
      records = await lookup(hostname, {
        all: true,
        verbatim: true,
      });
    } catch {
      throw new Error('Website hostname could not be resolved.');
    }

    if (records.length === 0) {
      throw new Error('Website hostname could not be resolved.');
    }

    for (const record of records) {
      if (this.isPrivateIp(record.address)) {
        throw new Error(
          'Website URL resolves to private network IP and cannot be fetched.',
        );
      }
    }

    this.hostnameSafetyCache.set(hostname, true);
  }

  private isBlockedHostname(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    );
  }

  private isPrivateIp(address: string): boolean {
    const version = isIP(address);
    if (version === 4) {
      return this.isPrivateIpv4(address);
    }
    if (version === 6) {
      return this.isPrivateIpv6(address);
    }
    return false;
  }

  private isPrivateIpv4(address: string): boolean {
    const parts = address.split('.').map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
      return false;
    }

    const [a, b] = parts;

    if (a === 10 || a === 127 || a === 0) {
      return true;
    }

    if (a === 169 && b === 254) {
      return true;
    }

    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }

    if (a === 192 && b === 168) {
      return true;
    }

    if (a === 100 && b >= 64 && b <= 127) {
      return true;
    }

    return false;
  }

  private isPrivateIpv6(address: string): boolean {
    const normalized = address.toLowerCase();

    if (normalized === '::1' || normalized === '::') {
      return true;
    }

    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }

    if (/^fe[89ab]/.test(normalized)) {
      return true;
    }

    if (normalized.startsWith('::ffff:')) {
      const mappedIpv4 = normalized.replace('::ffff:', '');
      return isIP(mappedIpv4) === 4 && this.isPrivateIpv4(mappedIpv4);
    }

    return false;
  }
}
