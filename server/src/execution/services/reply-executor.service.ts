import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MessageDirection,
  NotificationChannel,
  NotificationType,
  SenderType,
} from '@prisma/client';
import { AnalyticsService } from '../../analytics/analytics.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { FinalSalesDecision } from '../../sales-engine/types/final-sales-decision.types';
import { WhatsAppMessageSenderService } from '../../whatsapp/services/whatsapp-message-sender.service';
import { AiModeService } from './ai-mode.service';

export interface ReplyExecutionResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
}

@Injectable()
export class ReplyExecutorService {
  private readonly logger = new Logger(ReplyExecutorService.name);
  private readonly duplicateWindowMs = 60_000;

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
    private readonly aiModeService: AiModeService,
    private readonly whatsappMessageSenderService: WhatsAppMessageSenderService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async executeDecisionReply(
    conversationId: string,
    decision: FinalSalesDecision,
  ): Promise<ReplyExecutionResult> {
    const conversation =
      await this.conversationsService.getConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const mode = await this.aiModeService.getMode(conversationId);
    const basePayload = {
      intent: decision.intent,
      leadStage: decision.leadStage,
      shouldHandoff: decision.shouldHandoff,
    };

    if (mode === 'paused') {
      return this.skip('ai_mode_paused', {
        workspaceId: conversation.workspaceId,
        conversationId,
        payloadJson: basePayload,
      });
    }

    if (mode === 'suggest_only') {
      return this.skip('ai_mode_suggest_only', {
        workspaceId: conversation.workspaceId,
        conversationId,
        payloadJson: basePayload,
      });
    }

    if (!decision.shouldSendReply) {
      return this.skip('decision_should_not_send', {
        workspaceId: conversation.workspaceId,
        conversationId,
        payloadJson: basePayload,
      });
    }

    const text = decision.suggestedReply.trim();
    if (text.length === 0) {
      return this.skip('empty_suggested_reply', {
        workspaceId: conversation.workspaceId,
        conversationId,
        payloadJson: basePayload,
      });
    }

    const duplicate = await this.hasRecentDuplicateReply(conversationId, text);
    if (duplicate) {
      return this.skip('duplicate_within_debounce_window', {
        workspaceId: conversation.workspaceId,
        conversationId,
        payloadJson: basePayload,
      });
    }

    try {
      await this.whatsappMessageSenderService.sendTextMessage({
        workspaceId: conversation.workspaceId,
        to: conversation.phoneNumber,
        text,
      });
    } catch (error: unknown) {
      await this.analyticsService.safeTrack({
        workspaceId: conversation.workspaceId,
        conversationId,
        type: 'reply_failed',
        payloadJson: {
          ...basePayload,
          errorMessage: this.toErrorMessage(error),
        },
      });

      await this.notificationsService.createAndDispatch({
        workspaceId: conversation.workspaceId,
        type: NotificationType.REPLY_FAILED,
        channel: NotificationChannel.BOTH,
        title: 'AI reply gonderilemedi',
        message:
          'AI cevabi WhatsApp kanalina iletilemedi. Manuel takip veya yeniden deneme onerilir.',
        payload: {
          conversationId,
          errorMessage: this.toErrorMessage(error),
        },
      });

      throw error;
    }

    await this.analyticsService.safeTrack({
      workspaceId: conversation.workspaceId,
      conversationId,
      type: 'reply_sent',
      payloadJson: {
        ...basePayload,
        textLength: text.length,
      },
    });

    this.logger.log(
      `Reply sent conversationId=${conversationId} intent=${decision.intent} action=${decision.nextBestAction ?? 'none'}`,
    );

    return {
      sent: true,
      skipped: false,
    };
  }

  async manualSend(
    conversationId: string,
    text: string,
  ): Promise<ReplyExecutionResult> {
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return this.skip('empty_manual_text');
    }

    const conversation =
      await this.conversationsService.getConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.whatsappMessageSenderService.sendTextMessage({
      workspaceId: conversation.workspaceId,
      to: conversation.phoneNumber,
      text: trimmedText,
    });

    this.logger.log(`Manual reply sent conversationId=${conversationId}`);

    return {
      sent: true,
      skipped: false,
    };
  }

  private async hasRecentDuplicateReply(
    conversationId: string,
    content: string,
  ): Promise<boolean> {
    const createdAtThreshold = new Date(Date.now() - this.duplicateWindowMs);
    const existing = await this.prisma.message.findFirst({
      where: {
        conversationId,
        direction: MessageDirection.OUTBOUND,
        senderType: SenderType.AI,
        content,
        createdAt: {
          gte: createdAtThreshold,
        },
      },
    });

    return Boolean(existing);
  }

  private skip(
    reason: string,
    input?: {
      workspaceId: string;
      conversationId: string;
      payloadJson?: Record<string, unknown>;
    },
  ): ReplyExecutionResult {
    if (input) {
      void this.analyticsService.safeTrack({
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        type: 'reply_skipped',
        payloadJson: {
          reason,
          ...input.payloadJson,
        },
      });
    }

    this.logger.log(`Reply skipped reason=${reason}`);
    return {
      sent: false,
      skipped: true,
      reason,
    };
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return 'unknown_error';
  }
}
