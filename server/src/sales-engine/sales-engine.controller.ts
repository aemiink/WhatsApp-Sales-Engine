import { Body, Controller, Post } from '@nestjs/common';
import { EvaluateSalesInputDto } from './dto/evaluate-sales-input.dto';
import { TestSalesDecisionDto } from './dto/test-sales-decision.dto';
import { SalesEngineService } from './sales-engine.service';
import { FinalSalesDecision } from './types/final-sales-decision.types';

@Controller(['sales', 'sales-engine'])
export class SalesEngineController {
  constructor(private readonly salesEngineService: SalesEngineService) {}

  @Post('evaluate')
  evaluate(@Body() body: EvaluateSalesInputDto) {
    return this.salesEngineService.evaluate(body);
  }

  @Post('decision/test')
  async testDecision(
    @Body() body: TestSalesDecisionDto,
  ): Promise<FinalSalesDecision> {
    return this.salesEngineService.generateDecision(body);
  }
}
