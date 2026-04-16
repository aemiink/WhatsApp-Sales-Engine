import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { InstagramDataFetcherService } from '../instagram-analysis/instagram-data-fetcher.service';
import { InstagramSignalExtractorService } from '../instagram-analysis/instagram-signal-extractor.service';
import { WebsiteFetchResult } from '../website-analysis/types/website-analysis.types';
import { WebsiteFetcherService } from '../website-analysis/website-fetcher.service';
import { WebsiteParserService } from '../website-analysis/website-parser.service';
import { WebsiteSignalExtractorService } from '../website-analysis/website-signal-extractor.service';
import { BrandContextResolverService } from './brand-context-resolver.service';
import { UpsertBrandContextDto } from './dto/upsert-brand-context.dto';

@Injectable()
export class BrandContextService {
  private readonly logger = new Logger(BrandContextService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandContextResolverService: BrandContextResolverService,
    private readonly websiteFetcherService: WebsiteFetcherService,
    private readonly websiteParserService: WebsiteParserService,
    private readonly websiteSignalExtractorService: WebsiteSignalExtractorService,
    private readonly instagramDataFetcherService: InstagramDataFetcherService,
    private readonly instagramSignalExtractorService: InstagramSignalExtractorService,
  ) {}

  async upsertBrandContext(input: UpsertBrandContextDto) {
    return this.prisma.brandContext.upsert({
      where: {
        workspaceId: input.workspaceId,
      },
      create: {
        workspaceId: input.workspaceId,
        tone: input.tone,
        salesStyle: input.salesStyle,
        dataJson: input.dataJson as Prisma.InputJsonValue | undefined,
      },
      update: {
        tone: input.tone,
        salesStyle: input.salesStyle,
        dataJson: input.dataJson as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getBrandContext(workspaceId: string) {
    const [brandContext, resolved] = await Promise.all([
      this.prisma.brandContext.findUnique({
        where: {
          workspaceId,
        },
      }),
      this.brandContextResolverService.getResolvedContext(workspaceId),
    ]);

    return {
      workspaceId,
      brandContext,
      sourceStatus: resolved.sourceStatus,
      confidence: resolved.confidence,
      resolvedContext: resolved.resolvedContext,
      lastResolvedAt: resolved.lastResolvedAt,
    };
  }

  async analyzeWebsite(workspaceId: string, websiteUrl: string) {
    this.logger.log(
      `Website analysis started workspace=${workspaceId} url=${websiteUrl}`,
    );

    let fetchedWebsite: WebsiteFetchResult;
    try {
      fetchedWebsite =
        await this.websiteFetcherService.fetchWebsite(websiteUrl);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Invalid website URL.';
      throw new BadRequestException(message);
    }

    const parsedPages = this.websiteParserService.parsePages(
      fetchedWebsite.pages,
    );
    const extraction = this.websiteSignalExtractorService.extract(parsedPages);
    const warnings = this.unique([
      ...fetchedWebsite.warnings,
      ...extraction.warnings,
    ]);

    const snapshot = await this.prisma.websiteAnalysisSnapshot.create({
      data: {
        workspaceId,
        rootUrl: fetchedWebsite.rootUrl,
        pagesJson: parsedPages as unknown as Prisma.InputJsonValue,
        extractedSignalsJson:
          extraction.signals as unknown as Prisma.InputJsonValue,
        confidence: extraction.confidence,
      },
    });

    const resolved =
      await this.brandContextResolverService.refreshResolvedContext(
        workspaceId,
        {
          websiteWarnings: warnings,
        },
      );

    this.logger.log(
      `Website analysis completed workspace=${workspaceId} snapshot=${snapshot.id}`,
    );

    return {
      snapshotId: snapshot.id,
      workspaceId,
      websiteSignals: extraction.signals,
      confidence: extraction.confidence,
      warnings,
      resolvedContext: resolved.resolvedContext,
      sourceStatus: resolved.sourceStatus,
      resolvedConfidence: resolved.confidence,
      lastResolvedAt: resolved.lastResolvedAt,
    };
  }

  async analyzeInstagram(workspaceId: string, preferredHandle?: string) {
    this.logger.log(`Instagram analysis started workspace=${workspaceId}`);

    const fetched =
      await this.instagramDataFetcherService.fetchWorkspaceInstagramData(
        workspaceId,
        preferredHandle,
      );
    const extraction = this.instagramSignalExtractorService.extract(fetched);

    const hasPayload =
      extraction.signals.username !== null ||
      fetched.postsJson.length > 0 ||
      Object.keys(fetched.profileJson).length > 0;

    let snapshotId: string | null = null;
    if (hasPayload) {
      const snapshot = await this.prisma.instagramAnalysisSnapshot.create({
        data: {
          workspaceId,
          instagramHandle: extraction.signals.username ?? 'unknown',
          profileJson: fetched.profileJson as unknown as Prisma.InputJsonValue,
          postsJson: fetched.postsJson as unknown as Prisma.InputJsonValue,
          extractedSignalsJson:
            extraction.signals as unknown as Prisma.InputJsonValue,
          confidence: extraction.confidence,
        },
      });

      snapshotId = snapshot.id;
    }

    const resolved =
      await this.brandContextResolverService.refreshResolvedContext(
        workspaceId,
        {
          instagramWarnings: extraction.warnings,
        },
      );

    this.logger.log(
      `Instagram analysis completed workspace=${workspaceId} snapshot=${snapshotId ?? 'none'}`,
    );

    return {
      snapshotId,
      workspaceId,
      instagramSignals: extraction.signals,
      confidence: extraction.confidence,
      warnings: extraction.warnings,
      resolvedContext: resolved.resolvedContext,
      sourceStatus: resolved.sourceStatus,
      resolvedConfidence: resolved.confidence,
      lastResolvedAt: resolved.lastResolvedAt,
    };
  }

  async refreshResolvedContext(workspaceId: string) {
    return this.brandContextResolverService.refreshResolvedContext(workspaceId);
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }
}
