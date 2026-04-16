import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AiProviderFactoryService } from './services/ai-provider-factory.service';

@Module({
  imports: [AppConfigModule],
  providers: [GeminiProvider, OpenAiProvider, AiProviderFactoryService],
  exports: [GeminiProvider, OpenAiProvider, AiProviderFactoryService],
})
export class AiModule {}
