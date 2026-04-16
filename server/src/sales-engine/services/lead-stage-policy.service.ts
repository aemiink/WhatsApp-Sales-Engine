import { Injectable } from '@nestjs/common';
import { SalesLeadStage } from '../constants/lead-stages';
import { SalesIntent } from '../constants/intents';
import { NormalizedObjection } from './objection-policy.service';

interface ApplyPolicyInput {
  aiLeadStage: string;
  mappedIntent: SalesIntent;
  objection: NormalizedObjection;
  shouldSendReply: boolean;
}

@Injectable()
export class LeadStagePolicyService {
  applyPolicy(input: ApplyPolicyInput): SalesLeadStage {
    const normalizedAiStage = this.normalizeStage(input.aiLeadStage);

    if (input.mappedIntent === 'support') {
      return 'support';
    }

    if (input.mappedIntent === 'appointment') {
      return 'hot';
    }

    if (input.mappedIntent === 'price_inquiry') {
      if (normalizedAiStage === 'new') {
        return 'qualified';
      }
      return normalizedAiStage;
    }

    if (
      input.objection !== null &&
      !input.shouldSendReply &&
      (input.mappedIntent === 'objection_price' ||
        input.mappedIntent === 'objection_trust' ||
        input.mappedIntent === 'objection_delay')
    ) {
      return 'lost';
    }

    return normalizedAiStage;
  }

  private normalizeStage(rawStage: string): SalesLeadStage {
    const normalized = rawStage.trim().toLowerCase();
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
}
