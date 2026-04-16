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
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async generateSalesDecision(
    input: AiProviderDecisionPrompt,
  ): Promise<string> {
    const apiKey = this.appConfigService.geminiApiKey;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const model = this.appConfigService.geminiModel;
    const timeoutMs = input.timeoutMs;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      this.logger.log(`Gemini decision request model=${model}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: input.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as unknown;
      const text = this.extractText(payload);
      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      return text;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini API request timed out.');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractText(payload: unknown): string | null {
    const payloadObject = asRecord(payload);
    const candidates = asArray(payloadObject?.candidates);

    if (!candidates || candidates.length === 0) {
      return null;
    }

    for (const candidate of candidates) {
      const content = asRecord(asRecord(candidate)?.content);
      const parts = asArray(content?.parts);
      if (!parts) {
        continue;
      }

      for (const part of parts) {
        const text = normalizeUnknownToString(asRecord(part)?.text);
        if (text) {
          return text;
        }
      }
    }

    return null;
  }
}
