import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceAccessService } from './workspace-access.service';

describe('WorkspaceAccessService', () => {
  describe('assertConversationInWorkspace', () => {
    it('returns conversation when workspace matches', async () => {
      const prismaMock = {
        conversation: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'conv-1',
            workspaceId: 'ws-1',
          }),
        },
      };

      const service = new WorkspaceAccessService(prismaMock as never);

      const result = await service.assertConversationInWorkspace(
        'conv-1',
        'ws-1',
      );

      expect(result).toEqual({ id: 'conv-1', workspaceId: 'ws-1' });
    });

    it('throws NotFound when conversation missing', async () => {
      const prismaMock = {
        conversation: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      const service = new WorkspaceAccessService(prismaMock as never);

      await expect(
        service.assertConversationInWorkspace('conv-x', 'ws-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when workspace mismatches', async () => {
      const prismaMock = {
        conversation: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'conv-1',
            workspaceId: 'ws-other',
          }),
        },
      };

      const service = new WorkspaceAccessService(prismaMock as never);

      await expect(
        service.assertConversationInWorkspace('conv-1', 'ws-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('assertHandoffSessionInWorkspace', () => {
    it('returns session when workspace matches', async () => {
      const prismaMock = {
        handoffSession: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'hs-1',
            conversationId: 'conv-1',
            conversation: { workspaceId: 'ws-1' },
          }),
        },
      };

      const service = new WorkspaceAccessService(prismaMock as never);

      const result = await service.assertHandoffSessionInWorkspace(
        'hs-1',
        'ws-1',
      );

      expect(result).toEqual({
        id: 'hs-1',
        conversationId: 'conv-1',
        workspaceId: 'ws-1',
      });
    });

    it('throws NotFound when session missing', async () => {
      const prismaMock = {
        handoffSession: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      const service = new WorkspaceAccessService(prismaMock as never);

      await expect(
        service.assertHandoffSessionInWorkspace('hs-x', 'ws-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when workspace mismatches', async () => {
      const prismaMock = {
        handoffSession: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'hs-1',
            conversationId: 'conv-1',
            conversation: { workspaceId: 'ws-other' },
          }),
        },
      };

      const service = new WorkspaceAccessService(prismaMock as never);

      await expect(
        service.assertHandoffSessionInWorkspace('hs-1', 'ws-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
