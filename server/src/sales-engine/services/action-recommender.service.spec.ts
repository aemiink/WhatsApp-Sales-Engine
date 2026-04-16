import { ActionRecommenderService } from './action-recommender.service';

describe('ActionRecommenderService', () => {
  const service = new ActionRecommenderService();

  it('returns handoff action when handoff flag is true', () => {
    const action = service.recommend({
      mappedIntent: 'general_info',
      leadStage: 'qualified',
      objection: null,
      shouldHandoff: true,
      aiNextBestAction: null,
    });

    expect(action).toBe('escalate_to_human');
  });

  it('maps deterministic actions by intent and objection', () => {
    expect(
      service.recommend({
        mappedIntent: 'appointment',
        leadStage: 'qualified',
        objection: null,
        shouldHandoff: false,
        aiNextBestAction: null,
      }),
    ).toBe('book_appointment');

    expect(
      service.recommend({
        mappedIntent: 'price_inquiry',
        leadStage: 'qualified',
        objection: 'price',
        shouldHandoff: false,
        aiNextBestAction: null,
      }),
    ).toBe('offer_discount');
  });

  it('uses valid AI action when available', () => {
    const action = service.recommend({
      mappedIntent: 'unknown',
      leadStage: 'new',
      objection: null,
      shouldHandoff: false,
      aiNextBestAction: 'send_catalog',
    });

    expect(action).toBe('send_catalog');
  });
});
