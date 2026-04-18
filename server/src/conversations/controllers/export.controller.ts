import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { AiMode, ConversationStatus, LeadStage, Prisma } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { PrismaService } from '../../database/prisma.service';

interface CsvRow {
  phoneNumber: string;
  leadStage: string;
  status: string;
  aiMode: string;
  lastMessageAt: string | null;
  createdAt: string;
}

@Controller('conversations')
export class ExportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('export')
  async exportCsv(
    @CurrentUser() user: RequestUser,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ): Promise<CsvRow[] | string> {
    const conversations = await this.prisma.conversation.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const rows: CsvRow[] = conversations.map((c) => ({
      phoneNumber: c.phoneNumber,
      leadStage: c.leadStage,
      status: c.status,
      aiMode: c.aiMode,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? '',
      createdAt: c.createdAt.toISOString(),
    }));

    if (format === 'json') {
      return rows;
    }

    const headers =
      'phoneNumber,leadStage,status,aiMode,lastMessageAt,createdAt';
    const csvRows = rows.map((row) =>
      [
        row.phoneNumber,
        row.leadStage,
        row.status,
        row.aiMode,
        row.lastMessageAt ?? '',
        row.createdAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [headers, ...csvRows].join('\n');
  }

  @Post('import')
  async importLeads(
    @CurrentUser() user: RequestUser,
    @Body() body: { leads: Array<{ phoneNumber: string; leadStage?: string }> },
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const lead of body.leads) {
      const existing = await this.prisma.conversation.findUnique({
        where: {
          workspaceId_phoneNumber: {
            workspaceId: user.workspaceId,
            phoneNumber: lead.phoneNumber,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const mappedLeadStage = this.toLeadStage(lead.leadStage);

      await this.prisma.conversation.create({
        data: {
          workspaceId: user.workspaceId,
          phoneNumber: lead.phoneNumber,
          ...(mappedLeadStage ? { leadStage: mappedLeadStage } : {}),
        },
      });
      imported++;
    }

    return { imported, skipped };
  }

  @Post('bulk-update')
  async bulkUpdate(
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      conversationIds: string[];
      action: 'leadStage' | 'status' | 'aiMode';
      value: string;
    },
  ): Promise<{ updated: number }> {
    const updateData: Prisma.ConversationUpdateManyMutationInput = {};

    if (body.action === 'leadStage') {
      const leadStage = this.toLeadStage(body.value);
      if (!leadStage) {
        throw new BadRequestException('leadStage value is required');
      }
      updateData.leadStage = leadStage;
    } else if (body.action === 'status') {
      updateData.status = this.toConversationStatus(body.value);
    } else if (body.action === 'aiMode') {
      updateData.aiMode = this.toAiMode(body.value);
    }

    await this.prisma.conversation.updateMany({
      where: {
        id: { in: body.conversationIds },
        workspaceId: user.workspaceId,
      },
      data: updateData,
    });

    return { updated: body.conversationIds.length };
  }

  private toLeadStage(value?: string): LeadStage | null {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    switch (normalized) {
      case 'new':
        return LeadStage.NEW;
      case 'qualified':
        return LeadStage.QUALIFIED;
      case 'hot':
        return LeadStage.HOT;
      case 'lost':
        return LeadStage.LOST;
      case 'support':
        return LeadStage.SUPPORT;
      default:
        throw new BadRequestException(`Unsupported leadStage value: ${value}`);
    }
  }

  private toConversationStatus(value: string): ConversationStatus {
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
      case 'active':
        return ConversationStatus.ACTIVE;
      case 'closed':
        return ConversationStatus.CLOSED;
      default:
        throw new BadRequestException(`Unsupported status value: ${value}`);
    }
  }

  private toAiMode(value: string): AiMode {
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
      case 'auto_reply':
        return AiMode.AUTO_REPLY;
      case 'suggest_only':
        return AiMode.SUGGEST_ONLY;
      case 'paused':
        return AiMode.PAUSED;
      default:
        throw new BadRequestException(`Unsupported aiMode value: ${value}`);
    }
  }
}
