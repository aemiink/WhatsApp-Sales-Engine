import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { BrandContextResolverService } from '../brand-context/brand-context-resolver.service';

interface UpdateTrainingSettingsInput {
  workspaceId: string;
  productsJson?: Record<string, unknown>[];
  faqJson?: Record<string, unknown>[];
  rulesJson?: Record<string, unknown>;
  forbiddenResponsesJson?: string[];
  handoffRulesJson?: string[];
}

@Injectable()
export class TrainingSettingsService {
  private readonly logger = new Logger(TrainingSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandContextResolverService: BrandContextResolverService,
  ) {}

  async getTrainingSettings(workspaceId: string) {
    const settings = await this.prisma.trainingSetting.findUnique({
      where: {
        workspaceId,
      },
    });

    return {
      workspaceId,
      trainingSettings: settings ?? {
        workspaceId,
        productsJson: [],
        faqJson: [],
        rulesJson: {},
        forbiddenResponsesJson: [],
        handoffRulesJson: [],
      },
    };
  }

  async updateTrainingSettings(input: UpdateTrainingSettingsInput) {
    const workspaceId = input.workspaceId;

    const updated = await this.prisma.trainingSetting.upsert({
      where: {
        workspaceId,
      },
      create: {
        workspaceId,
        productsJson: input.productsJson as Prisma.InputJsonValue | undefined,
        faqJson: input.faqJson as Prisma.InputJsonValue | undefined,
        rulesJson: input.rulesJson as Prisma.InputJsonValue | undefined,
        forbiddenResponsesJson: input.forbiddenResponsesJson as
          | Prisma.InputJsonValue
          | undefined,
        handoffRulesJson: input.handoffRulesJson as
          | Prisma.InputJsonValue
          | undefined,
      },
      update: {
        productsJson: input.productsJson as Prisma.InputJsonValue | undefined,
        faqJson: input.faqJson as Prisma.InputJsonValue | undefined,
        rulesJson: input.rulesJson as Prisma.InputJsonValue | undefined,
        forbiddenResponsesJson: input.forbiddenResponsesJson as
          | Prisma.InputJsonValue
          | undefined,
        handoffRulesJson: input.handoffRulesJson as
          | Prisma.InputJsonValue
          | undefined,
      },
    });

    const resolved =
      await this.brandContextResolverService.refreshResolvedContext(
        workspaceId,
      );

    this.logger.log(`Training settings updated workspace=${workspaceId}`);

    return {
      workspaceId,
      trainingSettings: updated,
      resolvedContext: resolved.resolvedContext,
      sourceStatus: resolved.sourceStatus,
      confidence: resolved.confidence,
      lastResolvedAt: resolved.lastResolvedAt,
    };
  }
}
