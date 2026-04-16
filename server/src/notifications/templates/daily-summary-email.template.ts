import { buildEmailTemplate, EmailTemplateResult } from './base-email-template';

interface DailySummaryEmailTemplateInput {
  appBaseUrl: string;
  totalConversations: number;
  aiHandledCount: number;
  handoffCount: number;
  hotLeadCount: number;
  topObjection: string;
  conversionSummary: string;
}

export function renderDailySummaryEmailTemplate(
  input: DailySummaryEmailTemplateInput,
): EmailTemplateResult {
  return buildEmailTemplate({
    subject: 'Gunluk performans ozeti hazir',
    title: 'Gunluk performans ozeti',
    summary:
      'Bugunun operasyon ozetini tek bakista inceleyip ertesi gun aksiyonlarini netlestirebilirsiniz.',
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
