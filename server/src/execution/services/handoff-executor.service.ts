import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../../analytics/analytics.service';
import { PrismaService } from '../../database/prisma.service';
import { AiModeValue } from '../dto/set-ai-mode.dto';
import { AiModeService } from './ai-mode.service';

@Injectable()
export class HandoffExecutorService {
  private readonly logger = new Logger(HandoffExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiModeService: AiModeService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async startHandoff(conversationId: string, reason?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.aiModeService.setMode(conversationId, 'paused');

    const active = await this.prisma.handoffSession.findFirst({
      where: {
        conversationId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (active) {
      this.logger.log(
        `Handoff already active conversationId=${conversationId}`,
      );
      return {
        handoffSessionId: active.id,
        aiMode: 'paused' as const,
        alreadyActive: true,
      };
    }

    const created = await this.prisma.handoffSession.create({
      data: {
        conversationId,
      },
    });

    this.logger.log(
      `Handoff started conversationId=${conversationId} reason=${reason ?? 'none'}`,
    );

    await this.analyticsService.safeTrack({
      workspaceId: conversation.workspaceId,
      conversationId,
      type: 'handoff_started',
      payloadJson: {
        handoffSessionId: created.id,
        reason: reason ?? null,
      },
    });

    return {
      handoffSessionId: created.id,
      aiMode: 'paused' as const,
      alreadyActive: false,
    };
  }

  async endHandoff(
    conversationId: string,
    resumeMode: AiModeValue = 'auto_reply',
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const active = await this.prisma.handoffSession.findFirst({
      where: {
        conversationId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (active) {
      await this.prisma.handoffSession.update({
        where: {
          id: active.id,
        },
        data: {
          endedAt: new Date(),
        },
      });
    }

    await this.aiModeService.setMode(conversationId, resumeMode);

    this.logger.log(
      `Handoff ended conversationId=${conversationId} resumeMode=${resumeMode}`,
    );

    if (active) {
      await this.analyticsService.safeTrack({
        workspaceId: conversation.workspaceId,
        conversationId,
        type: 'handoff_ended',
        payloadJson: {
          handoffSessionId: active.id,
          resumeMode,
        },
      });
    }

    return {
      handoffSessionId: active?.id ?? null,
      ended: Boolean(active),
      aiMode: resumeMode,
    };
  }
}
