import { Body, Controller, Post } from '@nestjs/common';
import { EvaluateSalesInputDto } from './dto/evaluate-sales-input.dto';
import { SalesEngineService } from './sales-engine.service';

@Controller('sales-engine')
export class SalesEngineController {
  constructor(private readonly salesEngineService: SalesEngineService) {}

  @Post('evaluate')
  evaluate(@Body() body: EvaluateSalesInputDto) {
    return this.salesEngineService.evaluate(body);
  }
}
