import { IntentMapperService } from './intent-mapper.service';

describe('IntentMapperService', () => {
  const service = new IntentMapperService();

  it('maps price-like intents', () => {
    expect(service.map('price inquiry')).toBe('price_inquiry');
    expect(service.map('fiyat itirazı')).toBe('objection_price');
  });

  it('maps support and appointment intents', () => {
    expect(service.map('support_request')).toBe('support');
    expect(service.map('randevu almak istiyor')).toBe('appointment');
  });

  it('returns unknown for empty values', () => {
    expect(service.map('')).toBe('unknown');
    expect(service.map(undefined)).toBe('unknown');
  });
});
