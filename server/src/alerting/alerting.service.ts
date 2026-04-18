import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/app-config.service';

export type AlertChannel = 'email' | 'slack';
export type AlertType =
  | 'connection_error'
  | 'rate_limit'
  | 'ai_failure'
  | 'hot_lead';

interface AlertConfig {
  workspaceId: string;
  channel: AlertChannel;
  destination: string;
  alertTypes: AlertType[];
  enabled: boolean;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private configs: Map<string, AlertConfig[]> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  configure(workspaceId: string, configs: AlertConfig[]): void {
    this.configs.set(workspaceId, configs);
  }

  sendAlert(workspaceId: string, alertType: AlertType, message: string): void {
    const workspaceConfigs = this.configs.get(workspaceId) ?? [];

    for (const cfg of workspaceConfigs) {
      if (!cfg.enabled || !cfg.alertTypes.includes(alertType)) continue;

      try {
        if (cfg.channel === 'email') {
          this.sendEmailAlert(cfg.destination, alertType, message);
        } else if (cfg.channel === 'slack') {
          this.sendSlackAlert(cfg.destination, alertType, message);
        }
      } catch (error) {
        this.logger.error(`Failed to send alert via ${cfg.channel}`, error);
      }
    }
  }

  private sendEmailAlert(
    email: string,
    alertType: AlertType,
    message: string,
  ): void {
    const subject = `[WhatsApp Sales Engine] ${this.formatAlertType(alertType)}`;
    this.logger.log(`Email alert to ${email}: ${subject} - ${message}`);
  }

  private sendSlackAlert(
    webhookUrl: string,
    alertType: AlertType,
    message: string,
  ): void {
    const payload = {
      text: `*WhatsApp Sales Engine Alert*`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: this.formatAlertType(alertType) },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message },
        },
      ],
    };
    this.logger.log(`Slack alert to webhook: ${JSON.stringify(payload)}`);
  }

  private formatAlertType(type: AlertType): string {
    const map: Record<AlertType, string> = {
      connection_error: 'Bağlantı Hatası',
      rate_limit: 'Rate Limit Aşıldı',
      ai_failure: 'AI Hatası',
      hot_lead: 'Yeni Sıcak Lead',
    };
    return map[type] ?? type;
  }
}
