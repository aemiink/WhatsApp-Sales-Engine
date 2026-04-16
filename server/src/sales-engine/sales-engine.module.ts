import { Module } from '@nestjs/common';
import { AiBrainModule } from '../ai-brain/ai-brain.module';
import { SalesEngineController } from './sales-engine.controller';
import { SalesEngineService } from './sales-engine.service';
import { ActionRecommenderService } from './services/action-recommender.service';
import { IntentMapperService } from './services/intent-mapper.service';
import { LeadStagePolicyService } from './services/lead-stage-policy.service';
import { ObjectionPolicyService } from './services/objection-policy.service';
import { SalesDecisionService } from './services/sales-decision.service';

@Module({
  imports: [AiBrainModule],
  controllers: [SalesEngineController],
  providers: [
    SalesEngineService,
    SalesDecisionService,
    IntentMapperService,
    LeadStagePolicyService,
    ObjectionPolicyService,
    ActionRecommenderService,
  ],
  exports: [SalesEngineService],
})
export class SalesEngineModule {}
