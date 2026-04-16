import { renderDailySummaryEmailTemplate } from './daily-summary-email.template';
import { renderHotLeadEmailTemplate } from './hot-lead-email.template';

describe('Email templates', () => {
  it('renders hot lead template with expected heading and cta', () => {
    const rendered = renderHotLeadEmailTemplate({
      appBaseUrl: 'https://app.example.com',
      leadLabel: '+90 532 123 45 67',
      conversationId: 'conv-1',
    });

    expect(rendered.subject).toContain('Yeni sicak lead');
    expect(rendered.html).toContain('Konusmayi ac');
    expect(rendered.text).toContain('Conversation ID: conv-1');
  });

  it('renders daily summary template with metrics', () => {
    const rendered = renderDailySummaryEmailTemplate({
      appBaseUrl: 'https://app.example.com',
      totalConversations: 120,
      aiHandledCount: 88,
      handoffCount: 15,
      hotLeadCount: 18,
      topObjection: 'Fiyat',
      conversionSummary: 'Gecen haftaya gore +3 puan',
    });

    expect(rendered.subject).toContain('Gunluk performans ozeti');
    expect(rendered.html).toContain('Toplam yeni konusma: 120');
    expect(rendered.text).toContain('Analytics ekranini ac');
  });
});
