import { Module } from '@nestjs/common';
import { AiBrainController } from './ai-brain.controller';
import { AiBrainService } from './ai-brain.service';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.interface';
import { NoopAiProvider } from './providers/noop-ai.provider';

@Module({
  controllers: [AiBrainController],
  providers: [
    AiBrainService,
    NoopAiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useExisting: NoopAiProvider,
    },
  ],
  exports: [AiBrainService, AI_PROVIDER_TOKEN],
})
export class AiBrainModule {}
