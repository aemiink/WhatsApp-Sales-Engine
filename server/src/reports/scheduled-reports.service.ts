import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class ScheduledReportsService {
  private readonly logger = new Logger(ScheduledReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async sendDailyReports() {
    this.logger.log('Generating daily reports');
    await this.generateReport('daily');
  }

  async sendWeeklyReports() {
    this.logger.log('Generating weekly reports');
    await this.generateReport('weekly');
  }

  private async generateReport(type: 'daily' | 'weekly') {
    const workspaces = await this.prisma.workspace.findMany();

    for (const workspace of workspaces) {
      try {
        const stats = await this.getWorkspaceStats(workspace.id, type);
        await this.sendReportEmail(workspace.id, type, stats);
      } catch (error) {
        this.logger.error(
          `Failed to generate ${type} report for workspace ${workspace.id}`,
          error,
        );
      }
    }
  }

  private async getWorkspaceStats(
    workspaceId: string,
    type: 'daily' | 'weekly',
  ) {
    const daysAgo = type === 'daily' ? 1 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [conversations, messages, hotLeads] = await Promise.all([
      this.prisma.conversation.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      this.prisma.message.count({
        where: {
          conversation: { workspaceId },
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.conversation.count({
        where: { workspaceId, leadStage: 'HOT', updatedAt: { gte: startDate } },
      }),
    ]);

    return { conversations, messages, hotLeads };
  }

  private async sendReportEmail(
    workspaceId: string,
    type: 'daily' | 'weekly',
    stats: { conversations: number; messages: number; hotLeads: number },
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace || !this.config.resendApiKey) return;

    const emailBody = `
Rapor Türü: ${type === 'daily' ? 'Günlük' : 'Haftalık'}
Toplam Konuşmalar: ${stats.conversations}
Toplam Mesajlar: ${stats.messages}
Yeni Sıcak Leadler: ${stats.hotLeads}
    `.trim();

    this.logger.log(
      `Report prepared for workspace ${workspaceId}: ${emailBody}`,
    );
  }
}
