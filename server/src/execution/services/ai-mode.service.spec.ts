import { ForbiddenException } from '@nestjs/common';
import { AiModeService } from './ai-mode.service';

describe('AiModeService', () => {
  it('sets and gets ai mode', async () => {
    const prismaMock = {
      conversation: {
        update: jest.fn().mockResolvedValue({
          id: 'conv-1',
          aiMode: 'PAUSED',
        }),
        findUnique: jest.fn().mockResolvedValue({
          aiMode: 'AUTO_REPLY',
        }),
      },
    };

    const workspaceAccessMock = {
      assertConversationInWorkspace: jest.fn().mockResolvedValue({
        id: 'conv-1',
        workspaceId: 'ws-1',
      }),
    };

    const service = new AiModeService(
      prismaMock as never,
      workspaceAccessMock as never,
    );

    const updated = await service.setMode('conv-1', 'paused');
    const mode = await service.getMode('conv-1');

    expect(updated).toEqual({
      conversationId: 'conv-1',
      mode: 'paused',
    });
    expect(mode).toBe('auto_reply');
  });

  it('rejects setMode when conversation belongs to another workspace', async () => {
    const prismaMock = {
      conversation: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const workspaceAccessMock = {
      assertConversationInWorkspace: jest
        .fn()
        .mockRejectedValue(new ForbiddenException()),
    };

    const service = new AiModeService(
      prismaMock as never,
      workspaceAccessMock as never,
    );

    await expect(
      service.setMode('conv-1', 'paused', 'ws-attacker'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.conversation.update).not.toHaveBeenCalled();
  });
});
