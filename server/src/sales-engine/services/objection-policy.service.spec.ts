import { ObjectionPolicyService } from './objection-policy.service';

describe('ObjectionPolicyService', () => {
  const service = new ObjectionPolicyService();

  it('normalizes objection by mapped intent first', () => {
    expect(service.normalize(null, 'objection_price')).toBe('price');
    expect(service.normalize(null, 'objection_trust')).toBe('trust');
    expect(service.normalize(null, 'objection_delay')).toBe('timing');
  });

  it('normalizes textual objection hints', () => {
    expect(service.normalize('fiyat çok pahalı', 'unknown')).toBe('price');
    expect(service.normalize('size güvenemiyorum', 'unknown')).toBe('trust');
    expect(service.normalize('şimdi zamanım yok', 'unknown')).toBe('timing');
  });

  it('returns unknown or null when no known pattern exists', () => {
    expect(service.normalize('belirsiz bir itiraz', 'unknown')).toBe('unknown');
    expect(service.normalize(null, 'general_info')).toBeNull();
  });
});
