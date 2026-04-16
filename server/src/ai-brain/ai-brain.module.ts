import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { BrandContextModule } from '../brand-context/brand-context.module';
import { AppConfigModule } from '../config/app-config.module';
import { AiBrainController } from './ai-brain.controller';
import { AiBrainService } from './ai-brain.service';
import { AiContextAssemblerService } from './services/ai-context-assembler.service';
import { AiDecisionService } from './services/ai-decision.service';
import { AiDecisionValidatorService } from './services/ai-decision-validator.service';

@Module({
  imports: [AppConfigModule, AiModule, BrandContextModule],
  controllers: [AiBrainController],
  providers: [
    AiBrainService,
    AiDecisionService,
    AiContextAssemblerService,
    AiDecisionValidatorService,
  ],
  exports: [AiBrainService],
})
export class AiBrainModule {}
