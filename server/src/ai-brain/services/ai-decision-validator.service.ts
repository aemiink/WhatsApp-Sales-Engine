import { Injectable } from '@nestjs/common';
import {
  SalesAiDecision,
  salesAiDecisionSchema,
} from '../schemas/sales-ai-decision.schema';

@Injectable()
export class AiDecisionValidatorService {
  validate(rawOutput: unknown): SalesAiDecision {
    const normalized = this.normalizeRawOutput(rawOutput);
    const parsed = salesAiDecisionSchema.safeParse(normalized);

    if (!parsed.success) {
      throw new Error(
        `AI decision schema validation failed: ${parsed.error.issues
          .map((issue) => issue.message)
          .join(', ')}`,
      );
    }

    return parsed.data;
  }

  private normalizeRawOutput(rawOutput: unknown): unknown {
    if (
      typeof rawOutput === 'object' &&
      rawOutput !== null &&
      !Array.isArray(rawOutput)
    ) {
      return rawOutput;
    }

    if (typeof rawOutput !== 'string') {
      throw new Error('AI decision output is not a valid JSON payload.');
    }

    const sanitized = this.sanitizePotentialJson(rawOutput);

    try {
      return JSON.parse(sanitized) as unknown;
    } catch {
      throw new Error('AI decision output is not valid JSON.');
    }
  }

  private sanitizePotentialJson(rawOutput: string): string {
    const trimmed = rawOutput.trim();

    if (trimmed.startsWith('```')) {
      const withoutFence = trimmed
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim();
      if (withoutFence.startsWith('{') && withoutFence.endsWith('}')) {
        return withoutFence;
      }
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    const firstBraceIndex = trimmed.indexOf('{');
    const lastBraceIndex = trimmed.lastIndexOf('}');
    if (
      firstBraceIndex >= 0 &&
      lastBraceIndex > firstBraceIndex &&
      lastBraceIndex <= trimmed.length - 1
    ) {
      return trimmed.slice(firstBraceIndex, lastBraceIndex + 1);
    }

    return trimmed;
  }
}
