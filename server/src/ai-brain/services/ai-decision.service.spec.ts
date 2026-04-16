import { ServiceUnavailableException } from '@nestjs/common';
import { AiDecisionService } from './ai-decision.service';

const assembledInput = {
  workspaceId: 'ws-1',
  conversation: {
    id: 'conv-1',
    phoneNumber: '905551112233',
    leadStage: 'new' as const,
    lastMessages: [
      {
        senderType: 'user' as const,
        content: 'Fiyat nedir?',
        timestamp: '2026-04-16T12:00:00.000Z',
      },
    ],
  },
  incomingMessage: {
    externalMessageId: 'wamid.1',
    text: 'Fiyat nedir?',
    timestamp: '2026-04-16T12:00:00.000Z',
  },
  brandContext: {
    brandName: 'Acme',
    toneProfile: {
      primaryTone: 'friendly',
      toneHints: ['friendly'],
      salesStyle: 'balanced',
    },
    audienceProfile: {
      targetAudience: null,
      positioningHints: [],
    },
    productKnowledge: [],
    faq: [],
    responseRules: {
      forbiddenResponses: [],
      handoffRules: [],
      customRules: [],
    },
    sourceSummary: {
      websiteAvailable: true,
      instagramAvailable: true,
      manualTrainingAvailable: true,
    },
  },
  trainingSettings: {
    products: [],
    faq: [],
    rules: [],
    forbiddenResponses: [],
    handoffRules: [],
  },
};

describe('AiDecisionService', () => {
  it('retries on validator failure and succeeds on next attempt', async () => {
    const provider = {
      name: 'gemini' as const,
      generateSalesDecision: jest
        .fn()
        .mockResolvedValueOnce('invalid-json')
        .mockResolvedValueOnce('valid-json'),
    };

    const service = new AiDecisionService(
      {
        getExecutionOrder: jest.fn().mockReturnValue([provider]),
      } as never,
      {
        assembleFromMessage: jest.fn().mockResolvedValue(assembledInput),
      } as never,
      {
        validate: jest
          .fn()
          .mockImplementationOnce(() => {
            throw new Error('Invalid JSON');
          })
          .mockReturnValueOnce({
            detectedIntent: 'price_inquiry',
            leadStage: 'qualified',
            objectionDetected: null,
            suggestedReply: 'Merhaba, fiyat bilgisini paylaşayım.',
            shouldSendReply: true,
            shouldHandoff: false,
            nextBestAction: 'collect_budget',
            confidence: 0.81,
          }),
      } as never,
      {
        aiMaxRetries: 1,
        aiTimeoutMs: 1000,
      } as never,
    );

    const result = await service.generateDecision({
      conversationId: 'conv-1',
      messageId: 'msg-1',
    });

    expect(result.detectedIntent).toBe('price_inquiry');
    expect(provider.generateSalesDecision).toHaveBeenCalledTimes(2);
  });

  it('falls back to secondary provider when primary fails', async () => {
    const primaryProvider = {
      name: 'gemini' as const,
      generateSalesDecision: jest
        .fn()
        .mockRejectedValue(new Error('gemini failed')),
    };
    const fallbackProvider = {
      name: 'openai' as const,
      generateSalesDecision: jest.fn().mockResolvedValue('fallback-json'),
    };

    const service = new AiDecisionService(
      {
        getExecutionOrder: jest
          .fn()
          .mockReturnValue([primaryProvider, fallbackProvider]),
      } as never,
      {
        assembleFromMessage: jest.fn().mockResolvedValue(assembledInput),
      } as never,
      {
        validate: jest.fn().mockReturnValue({
          detectedIntent: 'support_request',
          leadStage: 'support',
          objectionDetected: null,
          suggestedReply: 'Destek talebinizi aldım.',
          shouldSendReply: true,
          shouldHandoff: true,
          nextBestAction: 'handoff_to_agent',
          confidence: 0.72,
        }),
      } as never,
      {
        aiMaxRetries: 0,
        aiTimeoutMs: 1000,
      } as never,
    );

    const result = await service.generateDecision({
      conversationId: 'conv-1',
      messageId: 'msg-1',
    });

    expect(result.leadStage).toBe('support');
    expect(primaryProvider.generateSalesDecision).toHaveBeenCalledTimes(1);
    expect(fallbackProvider.generateSalesDecision).toHaveBeenCalledTimes(1);
  });

  it('throws when all providers fail', async () => {
    const failingProvider = {
      name: 'gemini' as const,
      generateSalesDecision: jest
        .fn()
        .mockRejectedValue(new Error('provider timeout')),
    };

    const service = new AiDecisionService(
      {
        getExecutionOrder: jest.fn().mockReturnValue([failingProvider]),
      } as never,
      {
        assembleFromMessage: jest.fn().mockResolvedValue(assembledInput),
      } as never,
      {
        validate: jest.fn(),
      } as never,
      {
        aiMaxRetries: 0,
        aiTimeoutMs: 1000,
      } as never,
    );

    await expect(
      service.generateDecision({
        conversationId: 'conv-1',
        messageId: 'msg-1',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
