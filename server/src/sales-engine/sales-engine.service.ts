import { Injectable } from '@nestjs/common';
import { EvaluateSalesInputDto } from './dto/evaluate-sales-input.dto';

@Injectable()
export class SalesEngineService {
  evaluate(input: EvaluateSalesInputDto) {
    return {
      detectedIntent: 'unknown',
      leadStage: input.leadStage ?? 'new',
      objectionDetected: null,
      nextBestAction: null,
      message: input.message,
    };
  }
}
