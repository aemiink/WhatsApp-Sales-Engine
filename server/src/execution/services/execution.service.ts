import { Injectable, Logger } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { AnalyticsService } from '../../analytics/analytics.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { SalesEngineService } from '../../sales-engine/sales-engine.service';
import { EndHandoffExecutionDto } from '../dto/end-handoff.dto';
import { ManualSendMessageDto } from '../dto/manual-send-message.dto';
import { StartHandoffExecutionDto } from '../dto/start-handoff.dto';
import { HandoffExecutorService } from './handoff-executor.service';
import { ReplyExecutorService } from './reply-executor.service';
import type { ReplyExecutionResult } from './reply-executor.service';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly salesEngineService: SalesEngineService,
    private readonly conversationsService: ConversationsService,
    private readonly analyticsService: AnalyticsService,
    private readonly replyExecutorService: ReplyExecutorService,
    private readonly handoffExecutorService: HandoffExecutorService,
  ) {}

  async executeForInboundMessage(
    conversationId: string,
    messageId: string,
  ): Promise<{
    decision: Awaited<ReturnType<SalesEngineService['generateDecision']>>;
    handoff: unknown;
    reply: ReplyExecutionResult;
  }> {
    const decision = await this.salesEngineService.generateDecision({
      conversationId,
      messageId,
    });

    const conversation =
      await this.conversationsService.getConversationById(conversationId);

    if (conversation) {
      await this.analyticsService.safeTrack({
        workspaceId: conversation.workspaceId,
        conversationId,
        type: 'ai_decision_created',
        payloadJson: {
          messageId,
          intent: decision.intent,
          leadStage: decision.leadStage,
          shouldSendReply: decision.shouldSendReply,
          shouldHandoff: decision.shouldHandoff,
          confidence: decision.confidence,
        },
      });

      await this.syncLeadStage(conversationId, decision.leadStage, {
        currentLeadStage: conversation.leadStage,
        workspaceId: conversation.workspaceId,
      });
    }

    let handoffResult: unknown = null;
    if (decision.shouldHandoff) {
      handoffResult = await this.handoffExecutorService.startHandoff(
        conversationId,
        `decision:${decision.intent}`,
      );
    }

    const replyResult = await this.replyExecutorService.executeDecisionReply(
      conversationId,
      decision,
    );

    this.logger.log(
      `Execution completed conversationId=${conversationId} handoff=${decision.shouldHandoff} replySent=${replyResult.sent}`,
    );

    return {
      decision,
      handoff: handoffResult,
      reply: replyResult,
    };
  }

  async manualSend(
    conversationId: string,
    body: ManualSendMessageDto,
  ): Promise<ReplyExecutionResult> {
    return this.replyExecutorService.manualSend(conversationId, body.text);
  }

  async startManualHandoff(
    conversationId: string,
    body: StartHandoffExecutionDto,
  ) {
    return this.handoffExecutorService.startHandoff(
      conversationId,
      body.reason,
    );
  }

  async endManualHandoff(conversationId: string, body: EndHandoffExecutionDto) {
    return this.handoffExecutorService.endHandoff(
      conversationId,
      body.resumeMode ?? 'auto_reply',
    );
  }

  private async syncLeadStage(
    conversationId: string,
    targetStage: string,
    input: {
      currentLeadStage: LeadStage;
      workspaceId: string;
    },
  ): Promise<void> {
    const nextLeadStage = this.toPrismaLeadStage(targetStage);
    if (input.currentLeadStage === nextLeadStage) {
      return;
    }

    await this.conversationsService.updateLeadStage(
      conversationId,
      nextLeadStage,
    );

    await this.analyticsService.safeTrack({
      workspaceId: input.workspaceId,
      conversationId,
      type: 'lead_stage_changed',
      payloadJson: {
        from: this.toStageLabel(input.currentLeadStage),
        to: this.toStageLabel(nextLeadStage),
      },
    });
  }

  private toPrismaLeadStage(stage: string): LeadStage {
    if (stage === 'qualified') {
      return LeadStage.QUALIFIED;
    }

    if (stage === 'hot') {
      return LeadStage.HOT;
    }

    if (stage === 'lost') {
      return LeadStage.LOST;
    }

    if (stage === 'support') {
      return LeadStage.SUPPORT;
    }

    return LeadStage.NEW;
  }

  private toStageLabel(stage: LeadStage): string {
    if (stage === LeadStage.QUALIFIED) {
      return 'qualified';
    }

    if (stage === LeadStage.HOT) {
      return 'hot';
    }

    if (stage === LeadStage.LOST) {
      return 'lost';
    }

    if (stage === LeadStage.SUPPORT) {
      return 'support';
    }

    return 'new';
  }
}
