import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  it('returns existing conversation when phone already exists', async () => {
    const existing = {
      id: 'conv-1',
      workspaceId: 'ws-1',
      phoneNumber: '905551112233',
    };

    const prismaMock = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };

    const service = new ConversationsService(prismaMock as never);

    const result = await service.findOrCreateByPhone('ws-1', '905551112233');

    expect(result).toEqual(existing);
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it('creates conversation when phone does not exist', async () => {
    const created = {
      id: 'conv-2',
      workspaceId: 'ws-1',
      phoneNumber: '905551112233',
    };

    const prismaMock = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
        findUniqueOrThrow: jest.fn(),
      },
    };

    const service = new ConversationsService(prismaMock as never);

    const result = await service.findOrCreateByPhone('ws-1', '905551112233');

    expect(result).toEqual(created);
    expect(prismaMock.conversation.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'ws-1',
        phoneNumber: '905551112233',
      },
    });
  });
});
