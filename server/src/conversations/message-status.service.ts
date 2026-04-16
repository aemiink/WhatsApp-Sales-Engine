import { Injectable, Logger } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NormalizedWhatsAppEvent } from '../whatsapp/dto/normalized-whatsapp-event.dto';

@Injectable()
export class MessageStatusService {
  private readonly logger = new Logger(MessageStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateStatusFromEvent(
    event: NormalizedWhatsAppEvent,
  ): Promise<boolean> {
    if (!event.externalMessageId || !event.status) {
      return false;
    }

    const status = this.mapStatus(event.status);
    const timestamp = this.parseTimestamp(event.timestamp);

    const existing = await this.prisma.message.findUnique({
      where: {
        externalMessageId: event.externalMessageId,
      },
    });

    if (!existing) {
      this.logger.warn(
        `Status update skipped because message is missing externalMessageId=${event.externalMessageId}`,
      );
      return false;
    }

    await this.prisma.message.update({
      where: {
        id: existing.id,
      },
      data: {
        status,
        timestamp: timestamp ?? existing.timestamp,
      },
    });

    this.logger.log(
      `Message status updated externalMessageId=${event.externalMessageId} status=${status}`,
    );

    return true;
  }

  private mapStatus(value: string): MessageStatus {
    if (value === 'sent') {
      return MessageStatus.SENT;
    }

    if (value === 'delivered') {
      return MessageStatus.DELIVERED;
    }

    if (value === 'read') {
      return MessageStatus.READ;
    }

    if (value === 'received') {
      return MessageStatus.RECEIVED;
    }

    return MessageStatus.UNKNOWN;
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
}
