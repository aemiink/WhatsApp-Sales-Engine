import { ForbiddenException } from '@nestjs/common';
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
        sendText: jest.fn(),
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        assertConversationInWorkspace: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
        }),
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
    const sendMock = jest.fn().mockResolvedValue(undefined);

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
        sendText: sendMock,
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        assertConversationInWorkspace: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
        }),
      } as never,
    );

    const result = await service.executeDecisionReply('conv-1', baseDecision);

    expect(sendMock).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      conversationId: 'conv-1',
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
        sendText: jest.fn(),
      } as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        assertConversationInWorkspace: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
        }),
      } as never,
    );

    const result = await service.executeDecisionReply('conv-1', baseDecision);
    expect(result).toEqual({
      sent: false,
      skipped: true,
      reason: 'duplicate_within_debounce_window',
    });
  });

  it('rejects manualSend when workspace does not own conversation', async () => {
    const sendMock = jest.fn();
    const service = new ReplyExecutorService(
      {
        getConversationById: jest.fn(),
      } as never,
      {
        message: { findFirst: jest.fn() },
      } as never,
      {
        getMode: jest.fn(),
      } as never,
      {
        sendText: sendMock,
      } as never,
      {
        safeTrack: jest.fn(),
      } as never,
      {
        createAndDispatch: jest.fn(),
      } as never,
      {
        assertConversationInWorkspace: jest
          .fn()
          .mockRejectedValue(new ForbiddenException()),
      } as never,
    );

    await expect(
      service.manualSend('conv-1', 'hi', 'ws-attacker'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
