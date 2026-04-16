import { Injectable, Logger } from '@nestjs/common';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
  Prisma,
  SenderType,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NormalizedWhatsAppEvent } from '../whatsapp/dto/normalized-whatsapp-event.dto';

interface CreateInboundMessageInput {
  conversationId: string;
  event: NormalizedWhatsAppEvent;
}

interface CreateOutboundMessageInput {
  conversationId: string;
  externalMessageId?: string;
  content: string;
  timestamp?: Date;
  rawPayload: unknown;
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createInboundMessage(input: CreateInboundMessageInput) {
    const messageType = this.resolveMessageType(input.event.messageType);
    const timestamp = this.parseTimestamp(input.event.timestamp);

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: input.conversationId,
          externalMessageId: input.event.externalMessageId,
          senderType: SenderType.USER,
          direction: MessageDirection.INBOUND,
          messageType,
          content: input.event.textBody,
          status: MessageStatus.RECEIVED,
          timestamp,
          rawPayload: asInputJson(input.event.rawPayload),
        },
      });

      await tx.conversation.update({
        where: {
          id: input.conversationId,
        },
        data: {
          lastMessageAt: timestamp ?? new Date(),
        },
      });

      this.logger.log(
        `Inbound message persisted conversationId=${input.conversationId} messageId=${message.id}`,
      );

      return message;
    });
  }

  async createOutboundMessage(input: CreateOutboundMessageInput) {
    const timestamp = input.timestamp ?? new Date();

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: input.conversationId,
          externalMessageId: input.externalMessageId,
          senderType: SenderType.AI,
          direction: MessageDirection.OUTBOUND,
          messageType: MessageType.TEXT,
          content: input.content,
          status: MessageStatus.SENT,
          timestamp,
          rawPayload: asInputJson(input.rawPayload),
        },
      });

      await tx.conversation.update({
        where: {
          id: input.conversationId,
        },
        data: {
          lastMessageAt: timestamp,
        },
      });

      this.logger.log(
        `Outbound message persisted conversationId=${input.conversationId} messageId=${message.id}`,
      );

      return message;
    });
  }

  private parseTimestamp(timestamp: string | null): Date | null {
    if (!timestamp) {
      return null;
    }

    const asNumber = Number(timestamp);
    if (Number.isFinite(asNumber)) {
      return new Date(asNumber * 1000);
    }

    const asDate = new Date(timestamp);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }

  private resolveMessageType(messageType: string | null): MessageType {
    if (messageType === 'text') {
      return MessageType.TEXT;
    }

    if (messageType === 'status') {
      return MessageType.STATUS;
    }

    return MessageType.UNKNOWN;
  }
}
