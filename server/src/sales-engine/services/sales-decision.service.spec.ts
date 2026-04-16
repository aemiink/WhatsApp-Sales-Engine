import { SalesDecisionService } from './sales-decision.service';

describe('SalesDecisionService', () => {
  it('transforms AI decision into final sales decision', async () => {
    const service = new SalesDecisionService(
      {
        generateDecision: jest.fn().mockResolvedValue({
          detectedIntent: 'fiyat bilgisi',
          leadStage: 'new',
          objectionDetected: null,
          suggestedReply:
            'Merhaba, bütçenize uygun seçenekleri paylaşabilirim.',
          shouldSendReply: true,
          shouldHandoff: false,
          nextBestAction: null,
          confidence: 0.78,
        }),
      } as never,
      {
        map: jest.fn().mockReturnValue('price_inquiry'),
      } as never,
      {
        applyPolicy: jest.fn().mockReturnValue('qualified'),
      } as never,
      {
        normalize: jest.fn().mockReturnValue(null),
      } as never,
      {
        recommend: jest.fn().mockReturnValue('ask_budget'),
      } as never,
    );

    const result = await service.generateFinalDecision({
      conversationId: 'conv-1',
      messageId: 'msg-1',
    });

    expect(result.intent).toBe('price_inquiry');
    expect(result.leadStage).toBe('qualified');
    expect(result.nextBestAction).toBe('ask_budget');
    expect(result.shouldHandoff).toBe(false);
    expect(result.confidence).toBe(0.78);
  });

  it('overrides handoff for support-like conditions', () => {
    const service = new SalesDecisionService(
      {} as never,
      {
        map: jest.fn().mockReturnValue('support'),
      } as never,
      {
        applyPolicy: jest.fn().mockReturnValue('support'),
      } as never,
      {
        normalize: jest.fn().mockReturnValue(null),
      } as never,
      {
        recommend: jest.fn().mockReturnValue('escalate_to_human'),
      } as never,
    );

    const result = service.postProcessDecision({
      detectedIntent: 'support',
      leadStage: 'support',
      objectionDetected: null,
      suggestedReply: 'Talebinizi temsilciye yönlendiriyorum.',
      shouldSendReply: false,
      shouldHandoff: false,
      nextBestAction: null,
      confidence: 0.7,
    });

    expect(result.shouldHandoff).toBe(true);
    expect(result.shouldSendReply).toBe(true);
    expect(result.nextBestAction).toBe('escalate_to_human');
  });
});
