import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiProviderDecisionPrompt } from '../types/ai-provider.types';
import {
  asArray,
  asRecord,
  normalizeUnknownToString,
} from './provider-response.utils';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async generateSalesDecision(
    input: AiProviderDecisionPrompt,
  ): Promise<string> {
    const apiKey = this.appConfigService.openAiApiKey;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    const model = this.appConfigService.openAiModel;
    const timeoutMs = input.timeoutMs;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      this.logger.log(`OpenAI decision request model=${model}`);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: input.temperature ?? 0.2,
            response_format: {
              type: 'json_object',
            },
            messages: [
              {
                role: 'system',
                content: input.systemPrompt,
              },
              {
                role: 'user',
                content: input.userPrompt,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as unknown;
      const text = this.extractText(payload);
      if (!text) {
        throw new Error('OpenAI API returned an empty response.');
      }

      return text;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI API request timed out.');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractText(payload: unknown): string | null {
    const payloadObject = asRecord(payload);
    const choices = asArray(payloadObject?.choices);
    if (!choices || choices.length === 0) {
      return null;
    }

    const message = asRecord(asRecord(choices[0])?.message);
    const directContent = normalizeUnknownToString(message?.content);
    if (directContent) {
      return directContent;
    }

    const contentParts = asArray(message?.content);
    if (!contentParts) {
      return null;
    }

    const textParts: string[] = [];
    for (const part of contentParts) {
      const text = normalizeUnknownToString(asRecord(part)?.text);
      if (text) {
        textParts.push(text);
      }
    }

    if (textParts.length === 0) {
      return null;
    }

    return textParts.join('\n');
  }
}
