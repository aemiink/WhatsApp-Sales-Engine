import { Injectable } from '@nestjs/common';
import { TestAiDecisionDto } from './dto/test-ai-decision.dto';
import { SalesAiDecision } from './schemas/sales-ai-decision.schema';
import { AiDecisionService } from './services/ai-decision.service';

@Injectable()
export class AiBrainService {
  constructor(private readonly aiDecisionService: AiDecisionService) {}

  async generateDecision(input: TestAiDecisionDto): Promise<SalesAiDecision> {
    return this.aiDecisionService.generateDecision(input);
  }
}
