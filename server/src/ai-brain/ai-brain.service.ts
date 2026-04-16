import { Inject, Injectable } from '@nestjs/common';
import { GenerateAiDecisionDto } from './dto/generate-ai-decision.dto';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.interface';
import type { AiProvider } from './providers/ai-provider.interface';

@Injectable()
export class AiBrainService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  async generateDecision(input: GenerateAiDecisionDto): Promise<unknown> {
    return this.aiProvider.generateResponse(input);
  }
}
