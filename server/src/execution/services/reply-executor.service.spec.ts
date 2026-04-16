import { ReplyExecutorService } from './reply-executor.service';

const baseDecision = {
  intent: 'price_inquiry' as const,
  leadStage: 'qualified' as const,
  objection: null,
  suggestedReply: 'Merhaba, fiyat bilgisi paylaşabilirim.',
  shouldSendReply: true,
  shouldHandoff: false,
  nextBestAction: 'ask_budget',
  confidence: 0.8,
};

describe('ReplyExecutorService', () => {
  it('skips reply when ai mode is paused', async () => {
    const service = new ReplyExecutorService(
      {
        getConversationById: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
          phoneNumber: '905551112233',
        }),
      } as never,
      {
        message: {
          findFirst: jest.fn(),
        },
      } as never,
      {
        getMode: jest.fn().mockResolvedValue('paused'),
      } as never,
      {
        sendTextMessage: jest.fn(),
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.executeDecisionReply('conv-1', baseDecision);
    expect(result).toEqual({
      sent: false,
      skipped: true,
      reason: 'ai_mode_paused',
    });
  });

  it('sends reply when mode is auto_reply and decision allows', async () => {
    const sendMock = jest.fn().mockResolvedValue({});

    const service = new ReplyExecutorService(
      {
        getConversationById: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
          phoneNumber: '905551112233',
        }),
      } as never,
      {
        message: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as never,
      {
        getMode: jest.fn().mockResolvedValue('auto_reply'),
      } as never,
      {
        sendTextMessage: sendMock,
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.executeDecisionReply('conv-1', baseDecision);

    expect(sendMock).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      to: '905551112233',
      text: 'Merhaba, fiyat bilgisi paylaşabilirim.',
    });
    expect(result.sent).toBe(true);
    expect(result.skipped).toBe(false);
  });

  it('skips duplicate replies in debounce window', async () => {
    const service = new ReplyExecutorService(
      {
        getConversationById: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
          phoneNumber: '905551112233',
        }),
      } as never,
      {
        message: {
          findFirst: jest.fn().mockResolvedValue({ id: 'msg-dup' }),
        },
      } as never,
      {
        getMode: jest.fn().mockResolvedValue('auto_reply'),
      } as never,
      {
        sendTextMessage: jest.fn(),
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.executeDecisionReply('conv-1', baseDecision);
    expect(result).toEqual({
      sent: false,
      skipped: true,
      reason: 'duplicate_within_debounce_window',
    });
  });
});
