import { SalesLeadStage } from '../constants/lead-stages';
import { SalesIntent } from '../constants/intents';

export interface FinalSalesDecision {
  intent: SalesIntent;
  leadStage: SalesLeadStage;
  objection: 'price' | 'trust' | 'timing' | 'unknown' | null;
  suggestedReply: string;
  shouldSendReply: boolean;
  shouldHandoff: boolean;
  nextBestAction: string | null;
  confidence: number;
}
