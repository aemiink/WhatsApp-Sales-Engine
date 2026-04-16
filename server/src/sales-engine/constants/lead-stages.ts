export const SALES_LEAD_STAGES = [
  'new',
  'qualified',
  'hot',
  'lost',
  'support',
] as const;

export type SalesLeadStage = (typeof SALES_LEAD_STAGES)[number];
