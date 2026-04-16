import { LeadStagePolicyService } from './lead-stage-policy.service';

describe('LeadStagePolicyService', () => {
  const service = new LeadStagePolicyService();

  it('upgrades stage for price inquiry to qualified at minimum', () => {
    const stage = service.applyPolicy({
      aiLeadStage: 'new',
      mappedIntent: 'price_inquiry',
      objection: null,
      shouldSendReply: true,
    });

    expect(stage).toBe('qualified');
  });

  it('forces support stage for support intent', () => {
    const stage = service.applyPolicy({
      aiLeadStage: 'hot',
      mappedIntent: 'support',
      objection: null,
      shouldSendReply: true,
    });

    expect(stage).toBe('support');
  });

  it('marks lost on strong objection with disengage signal', () => {
    const stage = service.applyPolicy({
      aiLeadStage: 'qualified',
      mappedIntent: 'objection_trust',
      objection: 'trust',
      shouldSendReply: false,
    });

    expect(stage).toBe('lost');
  });
});
