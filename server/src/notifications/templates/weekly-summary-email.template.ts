import { buildEmailTemplate, EmailTemplateResult } from './base-email-template';

interface WeeklySummaryEmailTemplateInput {
  appBaseUrl: string;
  totalConversations: number;
  aiHandledCount: number;
  handoffCount: number;
  hotLeadCount: number;
  topObjection: string;
  conversionSummary: string;
}

export function renderWeeklySummaryEmailTemplate(
  input: WeeklySummaryEmailTemplateInput,
): EmailTemplateResult {
  return buildEmailTemplate({
    subject: 'Haftalik performans ozeti hazir',
    title: 'Haftalik performans ozeti',
    summary:
      'Haftalik trendleri ve kritik satis sinyallerini yonetsel gorunumde topladik.',
    details: [
      `Toplam yeni konusma: ${input.totalConversations}`,
      `AI handled count: ${input.aiHandledCount}`,
      `Handoff sayisi: ${input.handoffCount}`,
      `Hot lead sayisi: ${input.hotLeadCount}`,
      `Top objection: ${input.topObjection}`,
      `Conversion summary: ${input.conversionSummary}`,
    ],
    ctaLabel: 'Analytics ekranini ac',
    ctaUrl: `${input.appBaseUrl}/analytics`,
  });
}
