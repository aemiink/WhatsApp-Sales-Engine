import { Injectable } from '@nestjs/common';
import { SalesIntent } from '../constants/intents';

@Injectable()
export class IntentMapperService {
  map(rawIntent: string | null | undefined): SalesIntent {
    if (!rawIntent) {
      return 'unknown';
    }

    const normalized = rawIntent.trim().toLowerCase();

    if (this.includesAny(normalized, ['price', 'fiyat', 'ücret', 'ucret'])) {
      if (
        this.includesAny(normalized, [
          'objection',
          'itiraz',
          'pahalı',
          'pahali',
          'expensive',
          'too high',
        ])
      ) {
        return 'objection_price';
      }
      return 'price_inquiry';
    }

    if (
      this.includesAny(normalized, [
        'product',
        'ürün',
        'urun',
        'catalog',
        'katalog',
      ])
    ) {
      return 'product_inquiry';
    }

    if (
      this.includesAny(normalized, [
        'appointment',
        'randevu',
        'görüşme',
        'gorusme',
        'meeting',
      ])
    ) {
      return 'appointment';
    }

    if (
      this.includesAny(normalized, [
        'support',
        'destek',
        'arıza',
        'ariza',
        'issue',
      ])
    ) {
      return 'support';
    }

    if (
      this.includesAny(normalized, ['comparison', 'compare', 'karşılaştır'])
    ) {
      return 'comparison';
    }

    if (
      this.includesAny(normalized, [
        'trust',
        'güven',
        'guven',
        'şüphe',
        'suphe',
      ])
    ) {
      return 'objection_trust';
    }

    if (
      this.includesAny(normalized, [
        'delay',
        'later',
        'sonra',
        'zaman',
        'timing',
      ])
    ) {
      return 'objection_delay';
    }

    if (
      this.includesAny(normalized, [
        'info',
        'bilgi',
        'detay',
        'general',
        'genel',
      ])
    ) {
      return 'general_info';
    }

    return 'unknown';
  }

  private includesAny(value: string, candidates: string[]): boolean {
    return candidates.some((candidate) => value.includes(candidate));
  }
}
