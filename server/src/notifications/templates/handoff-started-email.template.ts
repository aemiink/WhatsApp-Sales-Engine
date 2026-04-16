import { buildEmailTemplate, EmailTemplateResult } from './base-email-template';

interface HandoffStartedEmailTemplateInput {
  appBaseUrl: string;
  reason?: string | null;
  conversationId?: string;
}

export function renderHandoffStartedEmailTemplate(
  input: HandoffStartedEmailTemplateInput,
): EmailTemplateResult {
  return buildEmailTemplate({
    subject: 'Temsilci devri baslatildi',
    title: 'Temsilci devri baslatildi',
    summary:
      'AI, konusmayi insan temsilciye devretme karari verdi. Operasyon takibi onerilir.',
    details: [
      input.conversationId
        ? `Conversation ID: ${input.conversationId}`
        : 'Conversation ID: bilinmiyor',
      input.reason ? `Sebep: ${input.reason}` : 'Sebep: otomatik handoff',
      'Temsilci panelinde gorusmeyi acip hizli donus yapin.',
    ],
    ctaLabel: 'Live chat paneline git',
    ctaUrl: `${input.appBaseUrl}/chat`,
  });
}
