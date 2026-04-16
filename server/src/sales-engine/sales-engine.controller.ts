import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { EvaluateSalesInputDto } from './dto/evaluate-sales-input.dto';
import { TestSalesDecisionDto } from './dto/test-sales-decision.dto';
import { SalesEngineService } from './sales-engine.service';
import { FinalSalesDecision } from './types/final-sales-decision.types';

@Controller(['sales', 'sales-engine'])
export class SalesEngineController {
  constructor(private readonly salesEngineService: SalesEngineService) {}

  @Roles('admin', 'agent')
  @Post('evaluate')
  evaluate(@Body() body: EvaluateSalesInputDto) {
    return this.salesEngineService.evaluate(body);
  }

  @Roles('admin', 'agent')
  @Post('decision/test')
  async testDecision(
    @Body() body: TestSalesDecisionDto,
  ): Promise<FinalSalesDecision> {
    return this.salesEngineService.generateDecision(body);
  }
}
