import { buildEmailTemplate, EmailTemplateResult } from './base-email-template';

interface HotLeadEmailTemplateInput {
  appBaseUrl: string;
  leadLabel: string;
  conversationId?: string;
}

export function renderHotLeadEmailTemplate(
  input: HotLeadEmailTemplateInput,
): EmailTemplateResult {
  const chatUrl = `${input.appBaseUrl}/chat`;

  return buildEmailTemplate({
    subject: 'Yeni sicak lead tespit edildi',
    title: 'Yeni sicak lead tespit edildi',
    summary:
      'AI konusma analizinde kapanisa yakin bir musteri sinyali algiladi.',
    details: [
      `Lead: ${input.leadLabel}`,
      input.conversationId
        ? `Conversation ID: ${input.conversationId}`
        : 'Conversation ID: bilinmiyor',
      'Mumkunse 15 dakika icinde temsilci takibi yapin.',
    ],
    ctaLabel: 'Konusmayi ac',
    ctaUrl: chatUrl,
  });
}
