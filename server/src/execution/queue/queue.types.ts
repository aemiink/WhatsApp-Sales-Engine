export interface InboundExecutionJobInput {
  workspaceId: string;
  conversationId: string;
  messageId: string;
}

export interface AiDecisionQueueJobInput {
  conversationId: string;
  messageId: string;
}

export interface OutboundMessageQueueJobInput {
  workspaceId: string;
  conversationId: string;
  to: string;
  text: string;
}
