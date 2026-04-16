import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEFAULT_WORKSPACE_ID } from '../common/constants/workspace.constants';
import { PrismaService } from '../database/prisma.service';
import { BrandContextResolverService } from '../brand-context/brand-context-resolver.service';
import { UpdateTrainingSettingsDto } from './dto/update-training-settings.dto';

@Injectable()
export class TrainingSettingsService {
  private readonly logger = new Logger(TrainingSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandContextResolverService: BrandContextResolverService,
  ) {}

  async getTrainingSettings(workspaceId?: string) {
    const resolvedWorkspaceId = workspaceId ?? DEFAULT_WORKSPACE_ID;
    const settings = await this.prisma.trainingSetting.findUnique({
      where: {
        workspaceId: resolvedWorkspaceId,
      },
    });

    return {
      workspaceId: resolvedWorkspaceId,
      trainingSettings: settings ?? {
        workspaceId: resolvedWorkspaceId,
        productsJson: [],
        faqJson: [],
        rulesJson: {},
        forbiddenResponsesJson: [],
        handoffRulesJson: [],
      },
    };
  }

  async updateTrainingSettings(input: UpdateTrainingSettingsDto) {
    const workspaceId = input.workspaceId ?? DEFAULT_WORKSPACE_ID;

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
