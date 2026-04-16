export interface AiProvider {
  generateResponse(input: unknown): Promise<unknown>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';
