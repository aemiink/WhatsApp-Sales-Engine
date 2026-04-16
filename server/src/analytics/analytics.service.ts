import { Injectable, Logger } from '@nestjs/common';
import {
  ConversationStatus,
  LeadStage,
  MessageDirection,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  ANALYTICS_EVENT_TYPES,
  AnalyticsEventType,
} from './constants/analytics-event-types';
import { TrackAnalyticsEventDto } from './dto/track-analytics-event.dto';

export interface TrackAnalyticsInput {
  workspaceId: string;
  conversationId?: string | null;
  type: AnalyticsEventType | string;
  payloadJson?: Record<string, unknown>;
}

interface AnalyticsCountMap {
  [key: string]: number;
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(input: TrackAnalyticsInput) {
    return this.prisma.analyticsEvent.create({
      data: {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId ?? null,
        type: input.type,
        payloadJson: input.payloadJson
          ? asInputJson(input.payloadJson)
          : undefined,
      },
    });
  }

  async trackEvent(input: TrackAnalyticsEventDto) {
    return this.track({
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      type: input.type,
      payloadJson: input.payloadJson,
    });
  }

  async getWorkspaceEvents(workspaceId: string) {
    return this.prisma.analyticsEvent.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOverview(workspaceId: string) {
    const [
      totalMessages,
      totalConversations,
      totalAiOutboundMessages,
      hotConversations,
      handoffConversations,
      avgResponseTimeSeconds,
    ] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversation: {
            workspaceId,
          },
        },
      }),
      this.prisma.conversation.count({
        where: {
          workspaceId,
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: {
            workspaceId,
          },
          direction: MessageDirection.OUTBOUND,
        },
      }),
      this.prisma.conversation.count({
        where: {
          workspaceId,
          leadStage: LeadStage.HOT,
        },
      }),
      this.countHandoffConversations(workspaceId),
      this.calculateAverageResponseTimeSeconds(workspaceId),
    ]);

    const inboundMessages = await this.prisma.message.count({
      where: {
        conversation: {
          workspaceId,
        },
        direction: MessageDirection.INBOUND,
      },
    });

    return {
      workspaceId,
      totals: {
        messages: totalMessages,
        conversations: totalConversations,
      },
      rates: {
        aiResponseRate: this.toRate(totalAiOutboundMessages, inboundMessages),
        humanTakeoverRate: this.toRate(
          handoffConversations,
          totalConversations,
        ),
        conversionToHotRate: this.toRate(hotConversations, totalConversations),
      },
      avgResponseTimeSeconds,
      generatedAt: new Date().toISOString(),
    };
  }

  async getFunnel(workspaceId: string) {
    const [leadStageGroups, closedConversations] = await Promise.all([
      this.prisma.conversation.groupBy({
        by: ['leadStage'],
        where: {
          workspaceId,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.conversation.count({
        where: {
          workspaceId,
          status: ConversationStatus.CLOSED,
        },
      }),
    ]);

    const counts = {
      new: 0,
      qualified: 0,
      hot: 0,
      closed: closedConversations,
    };

    for (const group of leadStageGroups) {
      if (group.leadStage === LeadStage.NEW) {
        counts.new = group._count._all;
      }

      if (group.leadStage === LeadStage.QUALIFIED) {
        counts.qualified = group._count._all;
      }

      if (group.leadStage === LeadStage.HOT) {
        counts.hot = group._count._all;
      }
    }

    const conversionRates = {
      newToQualified: this.toRate(counts.qualified, counts.new),
      qualifiedToHot: this.toRate(counts.hot, counts.qualified),
      hotToClosed: this.toRate(counts.closed, counts.hot),
    };

    return {
      workspaceId,
      stages: counts,
      conversionRates,
      dropOffRates: {
        newToQualified: this.toDropOff(conversionRates.newToQualified),
        qualifiedToHot: this.toDropOff(conversionRates.qualifiedToHot),
        hotToClosed: this.toDropOff(conversionRates.hotToClosed),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getConversationMetrics(workspaceId: string) {
    const [
      totalConversations,
      activeConversations,
      closedConversations,
      totalMessages,
      avgResponseTimeSeconds,
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          workspaceId,
        },
      }),
      this.prisma.conversation.count({
        where: {
          workspaceId,
          status: ConversationStatus.ACTIVE,
        },
      }),
      this.prisma.conversation.count({
        where: {
          workspaceId,
          status: ConversationStatus.CLOSED,
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: {
            workspaceId,
          },
        },
      }),
      this.calculateAverageResponseTimeSeconds(workspaceId),
    ]);

    return {
      workspaceId,
      totalConversations,
      activeConversations,
      closedConversations,
      totalMessages,
      avgMessagesPerConversation: this.toRate(
        totalMessages,
        totalConversations,
      ),
      avgResponseTimeSeconds,
      generatedAt: new Date().toISOString(),
    };
  }

  async getAiPerformance(workspaceId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        workspaceId,
        type: {
          in: [...ANALYTICS_EVENT_TYPES],
        },
      },
      select: {
        type: true,
        payloadJson: true,
      },
    });

    const counts = events.reduce<AnalyticsCountMap>((acc, row) => {
      acc[row.type] = (acc[row.type] ?? 0) + 1;
      return acc;
    }, {});

    const decisionEvents = events.filter(
      (event) => event.type === 'ai_decision_created',
    );

    const decisionCount = counts.ai_decision_created ?? 0;
    const replySentCount = counts.reply_sent ?? 0;
    const replySkippedCount = counts.reply_skipped ?? 0;
    const handoffStartedCount = counts.handoff_started ?? 0;

    const confidences = decisionEvents
      .map((event) => this.extractConfidence(event.payloadJson))
      .filter((value): value is number => value !== null);

    const avgConfidence =
      confidences.length > 0
        ? Number(
            (
              confidences.reduce((sum, value) => sum + value, 0) /
              confidences.length
            ).toFixed(4),
          )
        : 0;

    return {
      workspaceId,
      counts: {
        aiDecisionCount: decisionCount,
        replySentCount,
        replySkippedCount,
        handoffStartedCount,
      },
      rates: {
        aiReplySuccessRate: this.toRate(
          replySentCount,
          replySentCount + replySkippedCount,
        ),
        handoffFrequency: this.toRate(handoffStartedCount, decisionCount),
      },
      avgConfidence,
      generatedAt: new Date().toISOString(),
    };
  }

  async safeTrack(input: TrackAnalyticsInput): Promise<void> {
    try {
      await this.track(input);
    } catch (error: unknown) {
      this.logger.warn(
        `Analytics track failed type=${input.type} workspaceId=${input.workspaceId} conversationId=${input.conversationId ?? 'none'}`,
      );
      this.logger.debug(String(error));
    }
  }

  private async countHandoffConversations(
    workspaceId: string,
  ): Promise<number> {
    const records = await this.prisma.handoffSession.findMany({
      where: {
        conversation: {
          workspaceId,
        },
      },
      select: {
        conversationId: true,
      },
      distinct: ['conversationId'],
    });

    return records.length;
  }

  private async calculateAverageResponseTimeSeconds(
    workspaceId: string,
  ): Promise<number> {
    const orderedMessages = await this.prisma.message.findMany({
      where: {
        conversation: {
          workspaceId,
        },
        direction: {
          in: [MessageDirection.INBOUND, MessageDirection.OUTBOUND],
        },
      },
      select: {
        conversationId: true,
        direction: true,
        createdAt: true,
      },
      orderBy: [{ conversationId: 'asc' }, { createdAt: 'asc' }],
    });

    const latestInbound = new Map<string, Date>();
    let totalSeconds = 0;
    let responseCount = 0;

    for (const message of orderedMessages) {
      if (message.direction === MessageDirection.INBOUND) {
        latestInbound.set(message.conversationId, message.createdAt);
        continue;
      }

      const inboundAt = latestInbound.get(message.conversationId);
      if (!inboundAt) {
        continue;
      }

      const diffMs = message.createdAt.getTime() - inboundAt.getTime();
      if (diffMs < 0) {
        continue;
      }

      totalSeconds += diffMs / 1000;
      responseCount += 1;
    }

    return this.toRate(totalSeconds, responseCount);
  }

  private extractConfidence(
    payloadJson: Prisma.JsonValue | null,
  ): number | null {
    if (!isRecord(payloadJson)) {
      return null;
    }

    const confidence = payloadJson.confidence;
    if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
      return null;
    }

    if (confidence < 0) {
      return 0;
    }

    if (confidence > 1) {
      return 1;
    }

    return confidence;
  }

  private toRate(numerator: number, denominator: number): number {
    if (denominator <= 0) {
      return 0;
    }

    return Number((numerator / denominator).toFixed(4));
  }

  private toDropOff(conversionRate: number): number {
    if (conversionRate <= 0) {
      return 1;
    }

    if (conversionRate >= 1) {
      return 0;
    }

    return Number((1 - conversionRate).toFixed(4));
  }
}
