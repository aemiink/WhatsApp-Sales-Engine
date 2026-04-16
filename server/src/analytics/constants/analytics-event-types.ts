export const ANALYTICS_EVENT_TYPES = [
  'message_received',
  'message_sent',
  'ai_decision_created',
  'reply_sent',
  'reply_skipped',
  'handoff_started',
  'handoff_ended',
  'lead_stage_changed',
  'conversation_closed',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
