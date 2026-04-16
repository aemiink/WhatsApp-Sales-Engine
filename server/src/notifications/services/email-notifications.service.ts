import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AppConfigService } from '../../config/app-config.service';
import { renderConnectionErrorEmailTemplate } from '../templates/connection-error-email.template';
import { renderDailySummaryEmailTemplate } from '../templates/daily-summary-email.template';
import { EmailTemplateResult } from '../templates/base-email-template';
import { renderHandoffStartedEmailTemplate } from '../templates/handoff-started-email.template';
import { renderHotLeadEmailTemplate } from '../templates/hot-lead-email.template';
import { renderWeeklySummaryEmailTemplate } from '../templates/weekly-summary-email.template';

interface SendNotificationEmailInput {
  type: NotificationType;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  recipients: string[];
}

interface SendNotificationEmailResult {
  sent: boolean;
  providerMessageId?: string;
  reason?: string;
}

interface ResendEmailResponseBody {
  id?: string;
  message?: string;
}

function toStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

@Injectable()
export class EmailNotificationsService {
  private readonly logger = new Logger(EmailNotificationsService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async sendNotificationEmail(
    input: SendNotificationEmailInput,
  ): Promise<SendNotificationEmailResult> {
    const apiKey = this.appConfigService.resendApiKey;
    const from = this.appConfigService.emailFromAddress;

    if (!apiKey || !from) {
      this.logger.warn(
        `Email send skipped type=${input.type} reason=missing_resend_configuration`,
      );
      return {
        sent: false,
        reason: 'missing_resend_configuration',
      };
    }

    if (input.recipients.length === 0) {
      return {
        sent: false,
        reason: 'empty_recipient_list',
      };
    }

    const template = this.resolveTemplate(input);

    this.logger.log(
      `Email send requested type=${input.type} recipientCount=${input.recipients.length}`,
    );

    const controller = new AbortController();
    const timeoutMs = this.appConfigService.emailProviderTimeoutMs ?? 10000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: input.recipients,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      const body = (await response.json().catch(() => {
        return {};
      })) as ResendEmailResponseBody;

      if (!response.ok) {
        this.logger.error(
          `Email send failed type=${input.type} status=${response.status} message=${body.message ?? 'unknown'}`,
        );
        return {
          sent: false,
          reason: 'provider_error',
        };
      }

      this.logger.log(
        `Email sent type=${input.type} providerMessageId=${body.id ?? 'unknown'}`,
      );

      return {
        sent: true,
        providerMessageId: body.id,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`Email send timed out type=${input.type}`);
        return {
          sent: false,
          reason: 'timeout',
        };
      }

      this.logger.error(`Email send failed type=${input.type}`, error as Error);
      return {
        sent: false,
        reason: 'network_error',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveTemplate(
    input: SendNotificationEmailInput,
  ): EmailTemplateResult {
    const appBaseUrl = this.appConfigService.appBaseUrl;
    const payload = input.payload ?? {};

    if (input.type === NotificationType.LEAD_HOT) {
      return renderHotLeadEmailTemplate({
        appBaseUrl,
        leadLabel: toStringValue(payload.leadLabel) ?? 'Yeni hot lead',
        conversationId: toStringValue(payload.conversationId) ?? undefined,
      });
    }

    if (input.type === NotificationType.HANDOFF_STARTED) {
      return renderHandoffStartedEmailTemplate({
        appBaseUrl,
        reason: toStringValue(payload.reason),
        conversationId: toStringValue(payload.conversationId) ?? undefined,
      });
    }

    if (input.type === NotificationType.CONNECTION_ERROR) {
      return renderConnectionErrorEmailTemplate({
        appBaseUrl,
        detail: toStringValue(payload.errorMessage),
        recipient: toStringValue(payload.to),
      });
    }

    if (input.type === NotificationType.DAILY_SUMMARY) {
      return renderDailySummaryEmailTemplate({
        appBaseUrl,
        totalConversations: toNumberValue(payload.totalConversations),
        aiHandledCount: toNumberValue(payload.aiHandledCount),
        handoffCount: toNumberValue(payload.handoffCount),
        hotLeadCount: toNumberValue(payload.hotLeadCount),
        topObjection:
          toStringValue(payload.topObjection) ?? 'Fiyat itirazi baskin',
        conversionSummary:
          toStringValue(payload.conversionSummary) ?? 'Haftaya gore stabil',
      });
    }

    if (input.type === NotificationType.WEEKLY_SUMMARY) {
      return renderWeeklySummaryEmailTemplate({
        appBaseUrl,
        totalConversations: toNumberValue(payload.totalConversations),
        aiHandledCount: toNumberValue(payload.aiHandledCount),
        handoffCount: toNumberValue(payload.handoffCount),
        hotLeadCount: toNumberValue(payload.hotLeadCount),
        topObjection:
          toStringValue(payload.topObjection) ?? 'Fiyat itirazi baskin',
        conversionSummary:
          toStringValue(payload.conversionSummary) ??
          'Gecen haftaya gore artis',
      });
    }

    return {
      subject: input.title,
      html: `<p>${this.escapeHtml(input.message)}</p>`,
      text: `${input.title}\n${input.message}`,
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
