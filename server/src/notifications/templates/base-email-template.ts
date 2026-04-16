export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

interface BuildEmailTemplateInput {
  subject: string;
  title: string;
  summary: string;
  details: string[];
  ctaLabel: string;
  ctaUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildEmailTemplate(
  input: BuildEmailTemplateInput,
): EmailTemplateResult {
  const detailsHtml = input.details
    .map((item) => `<li style="margin:0 0 8px 0">${escapeHtml(item)}</li>`)
    .join('');

  const html = `
<!doctype html>
<html lang="en">
  <body style="font-family:Arial,sans-serif;background:#0f1117;color:#f5f7ff;margin:0;padding:24px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#171b24;border:1px solid #2e3340;border-radius:12px;padding:24px">
      <tr>
        <td>
          <p style="margin:0 0 12px 0;color:#a3ff00;font-size:12px;font-weight:bold;letter-spacing:.4px">WhatsApp Sales Engine</p>
          <h1 style="margin:0 0 10px 0;font-size:22px;line-height:1.3">${escapeHtml(input.title)}</h1>
          <p style="margin:0 0 18px 0;color:#c9cfdd;font-size:14px;line-height:1.6">${escapeHtml(input.summary)}</p>
          <ul style="margin:0 0 20px 18px;padding:0;color:#d9deea;font-size:14px;line-height:1.5">
            ${detailsHtml}
          </ul>
          <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#a3ff00;color:#06080f;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;font-size:14px">${escapeHtml(input.ctaLabel)}</a>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    input.title,
    input.summary,
    ...input.details.map((detail) => `- ${detail}`),
    `${input.ctaLabel}: ${input.ctaUrl}`,
  ].join('\n');

  return {
    subject: input.subject,
    html,
    text,
  };
}
