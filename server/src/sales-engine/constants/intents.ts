export const SALES_INTENTS = [
  'price_inquiry',
  'product_inquiry',
  'general_info',
  'support',
  'appointment',
  'comparison',
  'objection_price',
  'objection_trust',
  'objection_delay',
  'unknown',
] as const;

export type SalesIntent = (typeof SALES_INTENTS)[number];
