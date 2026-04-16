import { Injectable } from '@nestjs/common';
import { EvaluateSalesInputDto } from './dto/evaluate-sales-input.dto';
import { TestSalesDecisionDto } from './dto/test-sales-decision.dto';
import { FinalSalesDecision } from './types/final-sales-decision.types';
import { SalesDecisionService } from './services/sales-decision.service';

@Injectable()
export class SalesEngineService {
  constructor(private readonly salesDecisionService: SalesDecisionService) {}

  evaluate(input: EvaluateSalesInputDto) {
    return {
      detectedIntent: 'unknown',
      leadStage: input.leadStage ?? 'new',
      objectionDetected: null,
      nextBestAction: null,
      message: input.message,
    };
  }

  async generateDecision(
    input: TestSalesDecisionDto,
  ): Promise<FinalSalesDecision> {
    return this.salesDecisionService.generateFinalDecision(input);
  }
}
