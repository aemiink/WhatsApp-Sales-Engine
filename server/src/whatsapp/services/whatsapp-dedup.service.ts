import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { NormalizedWhatsAppEvent } from '../dto/normalized-whatsapp-event.dto';

function isUniqueConstraintError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return true;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class WhatsAppDedupService {
  constructor(private readonly prisma: PrismaService) {}

  createInboundDedupKey(event: NormalizedWhatsAppEvent): string {
    if (event.eventType === 'message' && event.externalMessageId) {
      return `message:${event.externalMessageId}`;
    }

    if (event.eventType === 'status' && event.externalMessageId) {
      return `status:${event.externalMessageId}:${event.status ?? 'unknown'}:${event.timestamp ?? 'unknown'}`;
    }

    const fallbackRaw = [
      event.eventType,
      event.fromPhoneNumber ?? 'unknown',
      event.timestamp ?? 'unknown',
      event.messageType ?? 'unknown',
      event.status ?? 'unknown',
      event.textBody ?? 'unknown',
    ].join('|');

    const hash = createHash('sha256').update(fallbackRaw).digest('hex');
    return `fallback:${hash}`;
  }

  async isDuplicate(event: NormalizedWhatsAppEvent): Promise<boolean> {
    if (event.eventType === 'message' && event.externalMessageId) {
      const existing = await this.prisma.message.findUnique({
        where: {
          externalMessageId: event.externalMessageId,
        },
        select: {
          id: true,
        },
      });

      return Boolean(existing);
    }

    const dedupKey = this.createInboundDedupKey(event);

    try {
      await this.prisma.inboundEventLog.create({
        data: {
          dedupKey,
          rawPayload: event.rawPayload as Prisma.InputJsonValue,
        },
      });

      return false;
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return true;
      }

      throw error;
    }
  }
}
