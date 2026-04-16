import { AiDecisionValidatorService } from './ai-decision-validator.service';

describe('AiDecisionValidatorService', () => {
  it('validates plain JSON decision payload', () => {
    const service = new AiDecisionValidatorService();

    const decision = service.validate(`{
      "detectedIntent": "price_inquiry",
      "leadStage": "qualified",
      "objectionDetected": null,
      "suggestedReply": "Merhaba, fiyat detaylarını paylaşayım.",
      "shouldSendReply": true,
      "shouldHandoff": false,
      "nextBestAction": "collect_budget",
      "confidence": 0.84
    }`);

    expect(decision.detectedIntent).toBe('price_inquiry');
    expect(decision.leadStage).toBe('qualified');
    expect(decision.confidence).toBe(0.84);
  });

  it('supports markdown code block outputs', () => {
    const service = new AiDecisionValidatorService();

    const decision = service.validate(`\`\`\`json
{
  "detectedIntent": "support_request",
  "leadStage": "support",
  "objectionDetected": null,
  "suggestedReply": "Merhaba, destek talebinizi temsilciye aktarıyorum.",
  "shouldSendReply": true,
  "shouldHandoff": true,
  "nextBestAction": "handoff_to_agent",
  "confidence": 0.7
}
\`\`\``);

    expect(decision.shouldHandoff).toBe(true);
    expect(decision.leadStage).toBe('support');
  });

  it('throws for invalid output', () => {
    const service = new AiDecisionValidatorService();

    expect(() => service.validate('not-json')).toThrow();
  });
});
