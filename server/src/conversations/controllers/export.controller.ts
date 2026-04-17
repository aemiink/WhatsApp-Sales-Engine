import { Body, Controller, Get, Post, Res, StreamableFile, Query } from '@nestjs/common';
import { Response } from 'express';
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

    const headers = 'phoneNumber,leadStage,status,aiMode,lastMessageAt,createdAt';
    const csvRows = rows.map((row) =>
      [row.phoneNumber, row.leadStage, row.status, row.aiMode, row.lastMessageAt ?? '', row.createdAt]
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

      await this.prisma.conversation.create({
        data: {
          workspaceId: user.workspaceId,
          phoneNumber: lead.phoneNumber,
          leadStage: (lead.leadStage as any) ?? 'new',
        },
      });
      imported++;
    }

    return { imported, skipped };
  }

  @Post('bulk-update')
  async bulkUpdate(
    @CurrentUser() user: RequestUser,
    @Body() body: {
      conversationIds: string[];
      action: 'leadStage' | 'status' | 'aiMode';
      value: string;
    },
  ): Promise<{ updated: number }> {
    const updateData: Record<string, any> = {};

    if (body.action === 'leadStage') {
      updateData.leadStage = body.value;
    } else if (body.action === 'status') {
      updateData.status = body.value;
    } else if (body.action === 'aiMode') {
      updateData.aiMode = body.value;
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
}