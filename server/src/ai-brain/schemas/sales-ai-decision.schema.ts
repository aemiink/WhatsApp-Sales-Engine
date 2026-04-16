import { z } from 'zod';

export const SALES_LEAD_STAGES = [
  'new',
  'qualified',
  'hot',
  'lost',
  'support',
] as const;

export const salesAiDecisionSchema = z.object({
  detectedIntent: z.string().min(1),
  leadStage: z.enum(SALES_LEAD_STAGES),
  objectionDetected: z.string().nullable(),
  suggestedReply: z.string().min(1),
  shouldSendReply: z.boolean(),
  shouldHandoff: z.boolean(),
  nextBestAction: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type SalesAiDecision = z.infer<typeof salesAiDecisionSchema>;
