import { ForbiddenException } from '@nestjs/common';
import { HandoffExecutorService } from './handoff-executor.service';

describe('HandoffExecutorService', () => {
  it('starts handoff and pauses ai mode', async () => {
    const aiModeServiceMock = {
      setMode: jest.fn().mockResolvedValue({
        conversationId: 'conv-1',
        mode: 'paused',
      }),
    };

    const prismaMock = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
        }),
      },
      handoffSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'hs-1',
        }),
      },
    };

    const service = new HandoffExecutorService(
      prismaMock as never,
      aiModeServiceMock as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.startHandoff('conv-1');

    expect(aiModeServiceMock.setMode).toHaveBeenCalledWith('conv-1', 'paused');
    expect(result).toEqual({
      handoffSessionId: 'hs-1',
      aiMode: 'paused',
      alreadyActive: false,
    });
  });

  it('ends active handoff and resumes ai mode', async () => {
    const aiModeServiceMock = {
      setMode: jest.fn().mockResolvedValue({
        conversationId: 'conv-1',
        mode: 'auto_reply',
      }),
    };

    const prismaMock = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-1',
        }),
      },
      handoffSession: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'hs-1',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const service = new HandoffExecutorService(
      prismaMock as never,
      aiModeServiceMock as never,
      {
        safeTrack: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createAndDispatch: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.endHandoff('conv-1', 'auto_reply');

    expect(prismaMock.handoffSession.update).toHaveBeenCalled();
    expect(aiModeServiceMock.setMode).toHaveBeenCalledWith(
      'conv-1',
      'auto_reply',
    );
    expect(result.ended).toBe(true);
  });

  it('rejects startHandoff when workspace mismatches', async () => {
    const aiModeServiceMock = {
      setMode: jest.fn(),
    };

    const prismaMock = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-owner',
        }),
      },
      handoffSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const service = new HandoffExecutorService(
      prismaMock as never,
      aiModeServiceMock as never,
      { safeTrack: jest.fn() } as never,
      { createAndDispatch: jest.fn() } as never,
    );

    await expect(
      service.startHandoff('conv-1', undefined, 'ws-attacker'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(aiModeServiceMock.setMode).not.toHaveBeenCalled();
    expect(prismaMock.handoffSession.create).not.toHaveBeenCalled();
  });

  it('rejects endHandoff when workspace mismatches', async () => {
    const aiModeServiceMock = { setMode: jest.fn() };

    const prismaMock = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          workspaceId: 'ws-owner',
        }),
      },
      handoffSession: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const service = new HandoffExecutorService(
      prismaMock as never,
      aiModeServiceMock as never,
      { safeTrack: jest.fn() } as never,
      { createAndDispatch: jest.fn() } as never,
    );

    await expect(
      service.endHandoff('conv-1', 'auto_reply', 'ws-attacker'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(aiModeServiceMock.setMode).not.toHaveBeenCalled();
    expect(prismaMock.handoffSession.update).not.toHaveBeenCalled();
  });
});
