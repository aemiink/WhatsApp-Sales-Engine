import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateAuditLogInput {
  workspaceId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata as Record<string, unknown>,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  async findMany(
    workspaceId: string,
    options?: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Record<string, unknown> = { workspaceId };

    if (options?.userId) where.userId = options.userId;
    if (options?.action) where.action = options.action;
    if (options?.entityType) where.entityType = options.entityType;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) (where.createdAt as Record<string, Date>).gte = options.startDate;
      if (options?.endDate) (where.createdAt as Record<string, Date>).lte = options.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }
}