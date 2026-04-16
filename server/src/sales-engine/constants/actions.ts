export const SALES_ACTIONS = [
  'ask_budget',
  'suggest_product',
  'offer_discount',
  'provide_proof',
  'book_appointment',
  'escalate_to_human',
  'send_catalog',
  'ask_clarification',
] as const;

export type SalesAction = (typeof SALES_ACTIONS)[number];
