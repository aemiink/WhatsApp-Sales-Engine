import { ResolvedBrandContext } from '../../brand-context/types/brand-context.types';
import { SALES_LEAD_STAGES } from '../schemas/sales-ai-decision.schema';

type SalesLeadStage = (typeof SALES_LEAD_STAGES)[number];

export interface AiDecisionInput {
  workspaceId: string;
  conversation: {
    id: string;
    phoneNumber: string;
    leadStage: SalesLeadStage;
    lastMessages: Array<{
      senderType: 'user' | 'ai' | 'human';
      content: string | null;
      timestamp: string | null;
    }>;
  };
  incomingMessage: {
    externalMessageId: string | null;
    text: string | null;
    timestamp: string | null;
  };
  brandContext: ResolvedBrandContext;
  trainingSettings: {
    products: unknown[];
    faq: unknown[];
    rules: unknown[];
    forbiddenResponses: string[];
    handoffRules: string[];
  };
}
