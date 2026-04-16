import {
  AiProvider,
  AiProviderName,
} from '../../src/ai/interfaces/ai-provider.interface';
import { AiProviderDecisionPrompt } from '../../src/ai/types/ai-provider.types';

interface MockAiOptions {
  name: AiProviderName;
  validResponse?: string;
}

export class MockAiProvider implements AiProvider {
  readonly name: AiProviderName;

  private mode: 'valid' | 'invalid' | 'timeout' = 'valid';

  private readonly validResponse: string;

  constructor(options: MockAiOptions) {
    this.name = options.name;
    this.validResponse =
      options.validResponse ??
      JSON.stringify({
        detectedIntent: 'price_inquiry',
        leadStage: 'qualified',
        objectionDetected: null,
        suggestedReply: 'Merhaba, size fiyat bilgisi paylaşabilirim.',
        shouldSendReply: true,
        shouldHandoff: false,
        nextBestAction: 'ask_budget',
        confidence: 0.8,
      });
  }

  setMode(mode: 'valid' | 'invalid' | 'timeout'): void {
    this.mode = mode;
  }

  async generateSalesDecision(
    input: AiProviderDecisionPrompt,
  ): Promise<string> {
    if (this.mode === 'timeout') {
      await new Promise((resolve) => {
        setTimeout(resolve, input.timeoutMs + 5);
      });
      throw new Error('Mock AI timeout');
    }

    if (this.mode === 'invalid') {
      return '{"invalid": true}';
    }

    return this.validResponse;
  }
}
