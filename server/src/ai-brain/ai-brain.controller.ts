import { Body, Controller, Post } from '@nestjs/common';
import { GenerateAiDecisionDto } from './dto/generate-ai-decision.dto';
import { AiBrainService } from './ai-brain.service';

@Controller('ai-brain')
export class AiBrainController {
  constructor(private readonly aiBrainService: AiBrainService) {}

  @Post('decisions')
  async generateDecision(
    @Body() body: GenerateAiDecisionDto,
  ): Promise<unknown> {
    return this.aiBrainService.generateDecision(body);
  }
}
