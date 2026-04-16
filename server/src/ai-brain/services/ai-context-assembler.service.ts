import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BrandContextResolverService } from '../../brand-context/brand-context-resolver.service';
import { PrismaService } from '../../database/prisma.service';
import { SALES_LEAD_STAGES } from '../schemas/sales-ai-decision.schema';
import { AiDecisionInput } from '../types/ai-decision-input.types';

type SalesLeadStage = (typeof SALES_LEAD_STAGES)[number];

@Injectable()
export class AiContextAssemblerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandContextResolverService: BrandContextResolverService,
  ) {}

  async assembleFromMessage(
    conversationId: string,
    messageId: string,
  ): Promise<AiDecisionInput> {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.conversationId !== conversationId) {
      throw new BadRequestException(
        'Message does not belong to the provided conversation.',
      );
    }

    if (!message.content || message.content.trim().length === 0) {
      throw new BadRequestException('Incoming message content is missing.');
    }

    const [recentMessages, resolvedContext, trainingSettings] =
      await Promise.all([
        this.prisma.message.findMany({
          where: {
            conversationId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),
        this.brandContextResolverService.getResolvedContext(
          message.conversation.workspaceId,
        ),
        this.prisma.trainingSetting.findUnique({
          where: {
            workspaceId: message.conversation.workspaceId,
          },
        }),
      ]);

    const hasContextSource = Object.values(
      resolvedContext.resolvedContext.sourceSummary,
    ).some(Boolean);
    if (!hasContextSource) {
      throw new NotFoundException(
        'Brand context is missing. Analyze website/instagram or set training settings first.',
      );
    }

    const sortedMessages = [...recentMessages].reverse();
    const cleanedMessages = sortedMessages
      .map((entry) => ({
        senderType: this.toSenderType(entry.senderType),
        content: entry.content?.trim() ?? null,
        timestamp: entry.timestamp?.toISOString() ?? null,
      }))
      .filter((entry) => entry.content !== null && entry.content.length > 0);

    return {
      workspaceId: message.conversation.workspaceId,
      conversation: {
        id: message.conversation.id,
        phoneNumber: message.conversation.phoneNumber,
        leadStage: this.toSalesLeadStage(message.conversation.leadStage),
        lastMessages: cleanedMessages,
      },
      incomingMessage: {
        externalMessageId: message.externalMessageId,
        text: message.content,
        timestamp: message.timestamp?.toISOString() ?? null,
      },
      brandContext: resolvedContext.resolvedContext,
      trainingSettings: {
        products: this.toArray(trainingSettings?.productsJson),
        faq: this.toArray(trainingSettings?.faqJson),
        rules: this.toRulesArray(trainingSettings?.rulesJson),
        forbiddenResponses: this.toStringArray(
          trainingSettings?.forbiddenResponsesJson,
        ),
        handoffRules: this.toStringArray(trainingSettings?.handoffRulesJson),
      },
    };
  }

  private toSalesLeadStage(value: string): SalesLeadStage {
    const normalized = value.toLowerCase();
    if (normalized === 'qualified') {
      return 'qualified';
    }
    if (normalized === 'hot') {
      return 'hot';
    }
    if (normalized === 'lost') {
      return 'lost';
    }
    if (normalized === 'support') {
      return 'support';
    }

    return 'new';
  }

  private toSenderType(value: string): 'user' | 'ai' | 'human' {
    const normalized = value.toLowerCase();
    if (normalized === 'ai') {
      return 'ai';
    }
    if (normalized === 'human') {
      return 'human';
    }

    return 'user';
  }

  private toArray(value: Prisma.JsonValue | null | undefined): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }

    return [];
  }

  private toRulesArray(value: Prisma.JsonValue | null | undefined): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [value];
    }

    return [];
  }

  private toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((entry) => {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        return [entry.trim()];
      }

      return [];
    });
  }
}
