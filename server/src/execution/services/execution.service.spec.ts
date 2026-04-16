import { ExecutionService } from './execution.service';

describe('ExecutionService', () => {
  it('runs decision flow and triggers handoff + reply execution', async () => {
    const service = new ExecutionService(
      {
        generateDecision: jest.fn().mockResolvedValue({
          intent: 'support',
          leadStage: 'support',
          objection: null,
          suggestedReply: 'Size yardımcı olmamız için temsilciye aktarıyorum.',
          shouldSendReply: true,
          shouldHandoff: true,
          nextBestAction: 'escalate_to_human',
          confidence: 0.77,
        }),
      } as never,
      {
        getConversationById: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
          leadStage: 'NEW',
        }),
        updateLeadStage: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
          leadStage: 'SUPPORT',
        }),
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        executeDecisionReply: jest.fn().mockResolvedValue({
          sent: false,
          skipped: true,
          reason: 'ai_mode_paused',
        }),
      } as never,
      {
        startHandoff: jest.fn().mockResolvedValue({
          handoffSessionId: 'hs-1',
          aiMode: 'paused',
          alreadyActive: false,
        }),
      } as never,
    );

    const result = await service.executeForInboundMessage('conv-1', 'msg-1');

    expect(result.decision.intent).toBe('support');
    expect(result.handoff).toEqual({
      handoffSessionId: 'hs-1',
      aiMode: 'paused',
      alreadyActive: false,
    });
    expect(result.reply.reason).toBe('ai_mode_paused');
  });
});
