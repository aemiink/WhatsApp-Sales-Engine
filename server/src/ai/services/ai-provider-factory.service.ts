import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  AiProvider,
  AiProviderName,
} from '../interfaces/ai-provider.interface';
import { GeminiProvider } from '../providers/gemini.provider';
import { OpenAiProvider } from '../providers/openai.provider';

@Injectable()
export class AiProviderFactoryService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly geminiProvider: GeminiProvider,
    private readonly openAiProvider: OpenAiProvider,
  ) {}

  getExecutionOrder(preferredProvider?: AiProviderName): AiProvider[] {
    const primaryName =
      preferredProvider ?? this.appConfigService.aiDefaultProvider;
    const providers: AiProvider[] = [];
    const primary = this.getProvider(primaryName);

    providers.push(primary);

    const fallbackName = this.getFallbackProviderName(primaryName);
    if (fallbackName && this.isProviderConfigured(fallbackName)) {
      providers.push(this.getProvider(fallbackName));
    }

    return providers;
  }

  getProvider(providerName: AiProviderName): AiProvider {
    if (providerName === 'gemini') {
      return this.geminiProvider;
    }

    return this.openAiProvider;
  }

  isProviderConfigured(providerName: AiProviderName): boolean {
    if (providerName === 'gemini') {
      return Boolean(this.appConfigService.geminiApiKey);
    }

    return Boolean(this.appConfigService.openAiApiKey);
  }

  private getFallbackProviderName(
    providerName: AiProviderName,
  ): AiProviderName | null {
    if (providerName === 'gemini') {
      return 'openai';
    }

    return 'gemini';
  }
}
