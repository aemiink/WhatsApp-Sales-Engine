export interface AiProviderDecisionPrompt {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
  temperature?: number;
}
