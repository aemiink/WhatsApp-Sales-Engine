import { NotFoundException } from '@nestjs/common';
import { AiContextAssemblerService } from './ai-context-assembler.service';

describe('AiContextAssemblerService', () => {
  it('assembles AI decision input from message, context and training settings', async () => {
    const prismaMock = {
      message: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-1',
          externalMessageId: 'wamid.1',
          content: 'Fiyatınız nedir?',
          timestamp: new Date('2026-04-16T12:00:00.000Z'),
          senderType: 'USER',
          conversation: {
            id: 'conv-1',
            workspaceId: 'ws-1',
            phoneNumber: '905551112233',
            leadStage: 'NEW',
          },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            senderType: 'AI',
            content: 'Merhaba, yardımcı olayım.',
            timestamp: new Date('2026-04-16T11:59:00.000Z'),
          },
          {
            senderType: 'USER',
            content: 'Fiyatınız nedir?',
            timestamp: new Date('2026-04-16T12:00:00.000Z'),
          },
          {
            senderType: 'USER',
            content: null,
            timestamp: new Date('2026-04-16T12:01:00.000Z'),
          },
        ]),
      },
      trainingSetting: {
        findUnique: jest.fn().mockResolvedValue({
          productsJson: [{ name: 'Premium Paket' }],
          faqJson: [{ question: 'Kargo?', answer: '2 gün' }],
          rulesJson: { tone: 'friendly' },
          forbiddenResponsesJson: ['Kesin garanti verme'],
          handoffRulesJson: ['Ödeme sorunu olursa devret'],
        }),
      },
    };

    const brandContextResolverMock = {
      getResolvedContext: jest.fn().mockResolvedValue({
        resolvedContext: {
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
            instagramAvailable: false,
            manualTrainingAvailable: true,
          },
        },
      }),
    };

    const service = new AiContextAssemblerService(
      prismaMock as never,
      brandContextResolverMock as never,
    );

    const result = await service.assembleFromMessage('conv-1', 'msg-1');

    expect(result.workspaceId).toBe('ws-1');
    expect(result.conversation.leadStage).toBe('new');
    expect(result.conversation.lastMessages).toHaveLength(2);
    expect(result.incomingMessage.text).toBe('Fiyatınız nedir?');
    expect(result.trainingSettings.products).toHaveLength(1);
    expect(result.brandContext.brandName).toBe('Acme');
  });

  it('throws when no brand context sources are available', async () => {
    const prismaMock = {
      message: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-1',
          externalMessageId: 'wamid.1',
          content: 'Merhaba',
          timestamp: new Date('2026-04-16T12:00:00.000Z'),
          senderType: 'USER',
          conversation: {
            id: 'conv-1',
            workspaceId: 'ws-1',
            phoneNumber: '905551112233',
            leadStage: 'NEW',
          },
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      trainingSetting: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const brandContextResolverMock = {
      getResolvedContext: jest.fn().mockResolvedValue({
        resolvedContext: {
          brandName: null,
          toneProfile: {
            primaryTone: null,
            toneHints: [],
            salesStyle: null,
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
            websiteAvailable: false,
            instagramAvailable: false,
            manualTrainingAvailable: false,
          },
        },
      }),
    };

    const service = new AiContextAssemblerService(
      prismaMock as never,
      brandContextResolverMock as never,
    );

    await expect(
      service.assembleFromMessage('conv-1', 'msg-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
