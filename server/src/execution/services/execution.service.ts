import { Injectable, Logger } from '@nestjs/common';
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
}
