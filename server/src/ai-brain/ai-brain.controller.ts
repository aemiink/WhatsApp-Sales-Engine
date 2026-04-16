import { Body, Controller, Post } from '@nestjs/common';
import { AiBrainService } from './ai-brain.service';
import { TestAiDecisionDto } from './dto/test-ai-decision.dto';
import { SalesAiDecision } from './schemas/sales-ai-decision.schema';

@Controller('ai')
export class AiBrainController {
  constructor(private readonly aiBrainService: AiBrainService) {}

  @Post('decision/test')
  async generateDecision(
    @Body() body: TestAiDecisionDto,
  ): Promise<SalesAiDecision> {
    return this.aiBrainService.generateDecision(body);
  }
}
