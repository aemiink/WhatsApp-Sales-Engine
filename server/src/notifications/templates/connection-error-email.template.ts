import { buildEmailTemplate, EmailTemplateResult } from './base-email-template';

interface ConnectionErrorEmailTemplateInput {
  appBaseUrl: string;
  detail?: string | null;
  recipient?: string | null;
}

export function renderConnectionErrorEmailTemplate(
  input: ConnectionErrorEmailTemplateInput,
): EmailTemplateResult {
  return buildEmailTemplate({
    subject: 'WhatsApp baglanti hatasi',
    title: 'WhatsApp baglanti hatasi',
    summary:
      'WhatsApp mesaj gonderim akisinda baglanti problemi algilandi. Baglanti kontrollerini dogrulayin.',
    details: [
      input.recipient ? `Alici: ${input.recipient}` : 'Alici: bilinmiyor',
      input.detail
        ? `Hata: ${input.detail}`
        : 'Hata: beklenmeyen baglanti sorunu',
      'Baglanti testini calistirip reconnect adimini uygulayin.',
    ],
    ctaLabel: 'Connection ekranini ac',
    ctaUrl: `${input.appBaseUrl}/connection`,
  });
}
