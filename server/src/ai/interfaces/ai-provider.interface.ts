import { AiProviderDecisionPrompt } from '../types/ai-provider.types';

export type AiProviderName = 'gemini' | 'openai';

export interface AiProvider {
  readonly name: AiProviderName;
  generateSalesDecision(input: AiProviderDecisionPrompt): Promise<string>;
}
