import { Injectable } from '@nestjs/common';
import { SalesIntent } from '../constants/intents';

export type NormalizedObjection =
  | 'price'
  | 'trust'
  | 'timing'
  | 'unknown'
  | null;

@Injectable()
export class ObjectionPolicyService {
  normalize(
    rawObjection: string | null | undefined,
    mappedIntent: SalesIntent,
  ): NormalizedObjection {
    if (mappedIntent === 'objection_price') {
      return 'price';
    }
    if (mappedIntent === 'objection_trust') {
      return 'trust';
    }
    if (mappedIntent === 'objection_delay') {
      return 'timing';
    }

    if (!rawObjection) {
      return null;
    }

    const normalized = rawObjection.trim().toLowerCase();
    if (this.includesAny(normalized, ['price', 'fiyat', 'pahalı', 'pahali'])) {
      return 'price';
    }
    if (this.includesAny(normalized, ['trust', 'güven', 'guven', 'şüphe'])) {
      return 'trust';
    }
    if (this.includesAny(normalized, ['timing', 'zaman', 'later', 'sonra'])) {
      return 'timing';
    }

    return 'unknown';
  }

  private includesAny(value: string, candidates: string[]): boolean {
    return candidates.some((candidate) => value.includes(candidate));
  }
}
