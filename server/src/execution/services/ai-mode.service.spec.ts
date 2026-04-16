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

    const service = new AiModeService(prismaMock as never);

    const updated = await service.setMode('conv-1', 'paused');
    const mode = await service.getMode('conv-1');

    expect(updated).toEqual({
      conversationId: 'conv-1',
      mode: 'paused',
    });
    expect(mode).toBe('auto_reply');
  });
});
