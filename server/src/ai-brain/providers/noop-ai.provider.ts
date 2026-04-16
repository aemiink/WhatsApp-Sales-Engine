import { Injectable } from '@nestjs/common';
import type { AiProvider } from './ai-provider.interface';

@Injectable()
export class NoopAiProvider implements AiProvider {
  generateResponse(input: unknown): Promise<unknown> {
    void input;
    return Promise.reject(
      new Error('AI provider implementation is not available in phase 1.'),
    );
  }
}
