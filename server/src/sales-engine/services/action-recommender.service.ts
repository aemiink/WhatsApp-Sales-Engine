import { Injectable } from '@nestjs/common';
import { SalesAction } from '../constants/actions';
import { SalesLeadStage } from '../constants/lead-stages';
import { SalesIntent } from '../constants/intents';
import { NormalizedObjection } from './objection-policy.service';

interface RecommendInput {
  mappedIntent: SalesIntent;
  leadStage: SalesLeadStage;
  objection: NormalizedObjection;
  shouldHandoff: boolean;
  aiNextBestAction: string | null;
}

@Injectable()
export class ActionRecommenderService {
  recommend(input: RecommendInput): SalesAction {
    const normalizedAiAction = this.normalizeAiAction(input.aiNextBestAction);
    if (input.shouldHandoff) {
      return 'escalate_to_human';
    }

    if (normalizedAiAction) {
      return normalizedAiAction;
    }

    if (input.mappedIntent === 'appointment') {
      return 'book_appointment';
    }

    if (input.mappedIntent === 'support' || input.leadStage === 'support') {
      return 'escalate_to_human';
    }

    if (input.objection === 'price') {
      return 'offer_discount';
    }

    if (input.objection === 'trust') {
      return 'provide_proof';
    }

    if (input.objection === 'timing') {
      return 'ask_clarification';
    }

    if (input.mappedIntent === 'price_inquiry') {
      return 'ask_budget';
    }

    if (input.mappedIntent === 'comparison') {
      return 'provide_proof';
    }

    if (input.mappedIntent === 'product_inquiry') {
      return 'suggest_product';
    }

    if (input.mappedIntent === 'general_info') {
      return 'send_catalog';
    }

    return 'ask_clarification';
  }

  private normalizeAiAction(aiAction: string | null): SalesAction | null {
    if (!aiAction) {
      return null;
    }

    const normalized = aiAction.trim().toLowerCase();
    if (normalized === 'ask_budget') {
      return 'ask_budget';
    }
    if (normalized === 'suggest_product') {
      return 'suggest_product';
    }
    if (normalized === 'offer_discount') {
      return 'offer_discount';
    }
    if (normalized === 'provide_proof') {
      return 'provide_proof';
    }
    if (normalized === 'book_appointment') {
      return 'book_appointment';
    }
    if (normalized === 'escalate_to_human') {
      return 'escalate_to_human';
    }
    if (normalized === 'send_catalog') {
      return 'send_catalog';
    }
    if (normalized === 'ask_clarification') {
      return 'ask_clarification';
    }

    return null;
  }
}
