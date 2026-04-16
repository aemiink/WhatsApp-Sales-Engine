import {
  MessageDirection,
  MessageStatus,
  MessageType,
  SenderType,
} from '@prisma/client';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  it('creates inbound message and updates conversation lastMessageAt', async () => {
    const createdMessage = { id: 'msg-1' };

    const tx = {
      message: {
        create: jest.fn().mockResolvedValue(createdMessage),
      },
      conversation: {
        update: jest.fn().mockResolvedValue(null),
      },
    };

    const prismaMock = {
      $transaction: jest
        .fn()
        .mockImplementation(
          async (handler: (client: typeof tx) => Promise<unknown>) =>
            handler(tx),
        ),
    };

    const service = new MessagesService(prismaMock as never);

    const result = await service.createInboundMessage({
      conversationId: 'conv-1',
      event: {
        eventType: 'message',
        externalMessageId: 'wamid.1',
        fromPhoneNumber: '905551112233',
        timestamp: '1710000000',
        messageType: 'text',
        textBody: 'Merhaba',
        status: null,
        contactProfileName: 'Ahmet',
        rawPayload: { sample: true },
      },
    });

    expect(result).toEqual(createdMessage);
    expect(tx.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: 'conv-1',
        externalMessageId: 'wamid.1',
        senderType: SenderType.USER,
        direction: MessageDirection.INBOUND,
        messageType: MessageType.TEXT,
        content: 'Merhaba',
        status: MessageStatus.RECEIVED,
        timestamp: new Date(1710000000 * 1000),
        rawPayload: { sample: true },
      },
    });
    expect(tx.conversation.update).toHaveBeenCalled();
  });

  it('creates outbound message with sent status', async () => {
    const createdMessage = { id: 'msg-2' };

    const tx = {
      message: {
        create: jest.fn().mockResolvedValue(createdMessage),
      },
      conversation: {
        update: jest.fn().mockResolvedValue(null),
      },
    };

    const prismaMock = {
      $transaction: jest
        .fn()
        .mockImplementation(
          async (handler: (client: typeof tx) => Promise<unknown>) =>
            handler(tx),
        ),
    };

    const service = new MessagesService(prismaMock as never);

    await service.createOutboundMessage({
      conversationId: 'conv-1',
      externalMessageId: 'wamid.out.1',
      content: 'Test',
      rawPayload: { ok: true },
      timestamp: new Date('2026-01-01T10:00:00.000Z'),
    });

    expect(tx.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: 'conv-1',
        externalMessageId: 'wamid.out.1',
        senderType: SenderType.AI,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: 'Test',
        status: MessageStatus.SENT,
        timestamp: new Date('2026-01-01T10:00:00.000Z'),
        rawPayload: { ok: true },
      },
    });
  });
});
