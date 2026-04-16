import { Injectable, Logger } from '@nestjs/common';
import { AiBrainService } from '../../ai-brain/ai-brain.service';
import { SalesAiDecision } from '../../ai-brain/schemas/sales-ai-decision.schema';
import { TestSalesDecisionDto } from '../dto/test-sales-decision.dto';
import { FinalSalesDecision } from '../types/final-sales-decision.types';
import { ActionRecommenderService } from './action-recommender.service';
import { IntentMapperService } from './intent-mapper.service';
import { LeadStagePolicyService } from './lead-stage-policy.service';
import { ObjectionPolicyService } from './objection-policy.service';

@Injectable()
export class SalesDecisionService {
  private readonly logger = new Logger(SalesDecisionService.name);

  constructor(
    private readonly aiBrainService: AiBrainService,
    private readonly intentMapperService: IntentMapperService,
    private readonly leadStagePolicyService: LeadStagePolicyService,
    private readonly objectionPolicyService: ObjectionPolicyService,
    private readonly actionRecommenderService: ActionRecommenderService,
  ) {}

  async generateFinalDecision(
    input: TestSalesDecisionDto,
  ): Promise<FinalSalesDecision> {
    const aiDecision = await this.aiBrainService.generateDecision({
      conversationId: input.conversationId,
      messageId: input.messageId,
      provider: input.provider,
    });

    const finalDecision = this.postProcessDecision(aiDecision);

    this.logger.log(
      `Sales decision generated intent=${finalDecision.intent} leadStage=${finalDecision.leadStage} action=${finalDecision.nextBestAction ?? 'none'}`,
    );

    return finalDecision;
  }

  postProcessDecision(aiDecision: SalesAiDecision): FinalSalesDecision {
    const mappedIntent = this.intentMapperService.map(
      aiDecision.detectedIntent,
    );
    const objection = this.objectionPolicyService.normalize(
      aiDecision.objectionDetected,
      mappedIntent,
    );

    const leadStage = this.leadStagePolicyService.applyPolicy({
      aiLeadStage: aiDecision.leadStage,
      mappedIntent,
      objection,
      shouldSendReply: aiDecision.shouldSendReply,
    });

    const policyHandoff = this.shouldHandoffByPolicy(
      mappedIntent,
      objection,
      leadStage,
      aiDecision,
    );
    const shouldHandoff = aiDecision.shouldHandoff || policyHandoff;

    const nextBestAction = this.actionRecommenderService.recommend({
      mappedIntent,
      leadStage,
      objection,
      shouldHandoff,
      aiNextBestAction: aiDecision.nextBestAction,
    });

    const shouldSendReply = shouldHandoff ? true : aiDecision.shouldSendReply;
    const suggestedReply = this.resolveSuggestedReply(
      aiDecision.suggestedReply,
      shouldHandoff,
    );

    return {
      intent: mappedIntent,
      leadStage,
      objection,
      suggestedReply,
      shouldSendReply,
      shouldHandoff,
      nextBestAction,
      confidence: this.normalizeConfidence(aiDecision.confidence),
    };
  }

  private shouldHandoffByPolicy(
    mappedIntent: string,
    objection: string | null,
    leadStage: string,
    aiDecision: SalesAiDecision,
  ): boolean {
    if (mappedIntent === 'support' || leadStage === 'support') {
      return true;
    }

    if (objection === 'trust' && aiDecision.confidence < 0.45) {
      return true;
    }

    if (
      (mappedIntent === 'objection_price' ||
        mappedIntent === 'objection_trust') &&
      aiDecision.shouldSendReply === false
    ) {
      return true;
    }

    return false;
  }

  private resolveSuggestedReply(
    aiSuggestedReply: string,
    shouldHandoff: boolean,
  ): string {
    if (!shouldHandoff) {
      return aiSuggestedReply;
    }

    if (aiSuggestedReply.trim().length > 0) {
      return aiSuggestedReply;
    }

    return 'Talebinizi en doğru şekilde çözmek için sizi temsilciye yönlendiriyorum.';
  }

  private normalizeConfidence(rawConfidence: number): number {
    if (!Number.isFinite(rawConfidence)) {
      return 0;
    }

    if (rawConfidence < 0) {
      return 0;
    }

    if (rawConfidence > 1) {
      return 1;
    }

    return Number(rawConfidence.toFixed(2));
  }
}
