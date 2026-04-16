import {
  ConversationStatus,
  LeadStage,
  MessageDirection,
} from '@prisma/client';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('tracks event with conversationId', async () => {
    const createMock = jest.fn().mockResolvedValue({ id: 'evt-1' });

    const service = new AnalyticsService({
      analyticsEvent: {
        create: createMock,
      },
    } as never);

    await service.track({
      workspaceId: 'ws-1',
      conversationId: 'conv-1',
      type: 'message_received',
      payloadJson: {
        messageId: 'msg-1',
      },
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        workspaceId: 'ws-1',
        conversationId: 'conv-1',
        type: 'message_received',
        payloadJson: {
          messageId: 'msg-1',
        },
      },
    });
  });

  it('calculates overview and handles response-time math', async () => {
    const service = new AnalyticsService({
      analyticsEvent: {
        create: jest.fn(),
      },
      message: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.direction === MessageDirection.OUTBOUND) {
            return Promise.resolve(8);
          }

          if (where.direction === MessageDirection.INBOUND) {
            return Promise.resolve(10);
          }

          return Promise.resolve(18);
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            conversationId: 'conv-1',
            direction: MessageDirection.INBOUND,
            createdAt: new Date('2026-04-16T10:00:00.000Z'),
          },
          {
            conversationId: 'conv-1',
            direction: MessageDirection.OUTBOUND,
            createdAt: new Date('2026-04-16T10:00:30.000Z'),
          },
          {
            conversationId: 'conv-2',
            direction: MessageDirection.INBOUND,
            createdAt: new Date('2026-04-16T10:01:00.000Z'),
          },
          {
            conversationId: 'conv-2',
            direction: MessageDirection.OUTBOUND,
            createdAt: new Date('2026-04-16T10:01:45.000Z'),
          },
        ]),
      },
      conversation: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.leadStage === LeadStage.HOT) {
            return Promise.resolve(4);
          }

          if (where.status === ConversationStatus.CLOSED) {
            return Promise.resolve(2);
          }

          return Promise.resolve(10);
        }),
      },
      handoffSession: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { conversationId: 'conv-1' },
            { conversationId: 'conv-3' },
          ]),
      },
    } as never);

    const result = await service.getOverview('ws-1');

    expect(result.totals.messages).toBe(18);
    expect(result.totals.conversations).toBe(10);
    expect(result.rates.aiResponseRate).toBe(0.8);
    expect(result.rates.humanTakeoverRate).toBe(0.2);
    expect(result.rates.conversionToHotRate).toBe(0.4);
    expect(result.avgResponseTimeSeconds).toBe(37.5);
  });

  it('returns safe zeros when ai events are empty', async () => {
    const service = new AnalyticsService({
      analyticsEvent: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as never);

    const result = await service.getAiPerformance('ws-1');

    expect(result.counts.aiDecisionCount).toBe(0);
    expect(result.rates.aiReplySuccessRate).toBe(0);
    expect(result.rates.handoffFrequency).toBe(0);
    expect(result.avgConfidence).toBe(0);
  });
});
