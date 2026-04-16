import { MessageStatus } from '@prisma/client';
import { MessageStatusService } from './message-status.service';

describe('MessageStatusService', () => {
  it('updates message status when external message exists', async () => {
    const prismaMock = {
      message: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'msg-1',
          timestamp: null,
        }),
        update: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new MessageStatusService(prismaMock as never);

    const updated = await service.updateStatusFromEvent({
      eventType: 'status',
      externalMessageId: 'wamid.1',
      fromPhoneNumber: '905551112233',
      timestamp: '1710000010',
      messageType: null,
      textBody: null,
      status: 'delivered',
      contactProfileName: null,
      rawPayload: {},
    });

    expect(updated).toBe(true);
    expect(prismaMock.message.update).toHaveBeenCalledWith({
      where: {
        id: 'msg-1',
      },
      data: {
        status: MessageStatus.DELIVERED,
        timestamp: new Date(1710000010 * 1000),
      },
    });
  });

  it('returns false when external message does not exist', async () => {
    const prismaMock = {
      message: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };

    const service = new MessageStatusService(prismaMock as never);

    const updated = await service.updateStatusFromEvent({
      eventType: 'status',
      externalMessageId: 'wamid.missing',
      fromPhoneNumber: '905551112233',
      timestamp: '1710000010',
      messageType: null,
      textBody: null,
      status: 'read',
      contactProfileName: null,
      rawPayload: {},
    });

    expect(updated).toBe(false);
    expect(prismaMock.message.update).not.toHaveBeenCalled();
  });
});
