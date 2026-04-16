export type PageHelpKey =
  | 'ai-setup'
  | 'dashboard'
  | 'live-chat'
  | 'ai-knowledge'
  | 'lead-management'
  | 'analytics'
  | 'connection'
  | 'automation-builder';

export interface PageHelpContent {
  title: string;
  purpose: string;
  canDo: string[];
  keyAreas: string[];
  criticalActions: string[];
}

export const helpContentMap: Record<PageHelpKey, PageHelpContent> = {
  'ai-setup': {
    title: 'AI Setup',
    purpose:
      'Bu ekran AI sistemini marka verinle hizli sekilde egitmek icin kullanilir.',
    canDo: [
      'Website, Instagram, Brand DNA adimlarini tamamla',
      'Urun ve kural bilgilerini editable sekilde guncelle',
      'Kaydet ve devam et akisiyla onboarding bitir',
    ],
    keyAreas: [
      'Adim bazli setup ilerlemesi',
      'Analiz preview kartlari',
      'Neden gerekli aciklamalari',
    ],
    criticalActions: ['Analizi baslat', 'Kaydet ve devam et', 'Setup tamamla'],
  },
  dashboard: {
    title: 'Dashboard / Overview',
    purpose: 'Gunluk operasyon ve satis sagligini tek bakista izlersin.',
    canDo: [
      'Operasyonel KPI degisimlerini takip et',
      'Canli konusmalari hizlica ac',
      'AI insight ve risk uyari alanlarini kontrol et',
    ],
    keyAreas: [
      'Operasyon KPI kartlari',
      'Sales health snapshot',
      'AI insights + kritik uyari bolumu',
    ],
    criticalActions: ['Canli sohbetlere gec', 'Hot lead takibini baslat'],
  },
  'live-chat': {
    title: 'Live Chat',
    purpose:
      'Canli konusmalari yonetir; AI kararlarini gorur ve operasyon aksiyonu alirsin.',
    canDo: [
      'Konusmalari filtreleyip onceliklendirme yap',
      'AI onerilerini kullan veya temsilci devral',
      'Ayni ekrandan mesaj gonder ve randevu aksiyonu al',
    ],
    keyAreas: [
      'Sol panel: conversation list + filtreler',
      'Orta panel: mesaj akisi',
      'Sag panel: AI Brain karar kartlari',
    ],
    criticalActions: ['AI cevaplasin', 'Temsilci devral', 'AI pause/resume'],
  },
  'ai-knowledge': {
    title: 'AI Knowledge / Training',
    purpose:
      'AI’in kullandigi bilgi kaynaklarini gorur, duzenler ve tekrar analiz ettirirsin.',
    canDo: [
      'Website ve Instagram sinyallerini kontrol et',
      'Products / FAQ / Rules alanlarini duzenle',
      'Yeniden analiz aksiyonu ile bilgiyi tazele',
    ],
    keyAreas: ['Tab bazli veri gorunumu', 'Editable text alanlari', 'Son guncelleme bilgisi'],
    criticalActions: ['Yeniden analiz et', 'Kaydet'],
  },
  'lead-management': {
    title: 'Lead Management',
    purpose:
      'Mini CRM ekraninda lead durumunu yonetir ve hizli aksiyonlarla ilerlersin.',
    canDo: [
      'Stage filtreleriyle lead listesini sadeleştir',
      'Satir bazli hizli aksiyonlari uygula',
      'Temsilci atama ve not akisini yonet',
    ],
    keyAreas: ['Filtre chipleri', 'Lead tablo satirlari', 'Sag panel lead detay'],
    criticalActions: ['Sohbeti ac', 'Stage guncelle', 'Temsilciye ata'],
  },
  analytics: {
    title: 'Analytics',
    purpose:
      'Performansi hizli yorumlamak icin overview, funnel ve AI metriklerini sirali sunar.',
    canDo: [
      'Donusum ve AI oran trendini izle',
      'Funnel asamalarindaki kayiplari gor',
      'Konusma insight’lariyla operasyon karari al',
    ],
    keyAreas: ['Overview trend', 'Funnel', 'AI performance', 'Conversation insights'],
    criticalActions: ['Kritik uyari alanini kontrol et'],
  },
  connection: {
    title: 'WhatsApp Connection',
    purpose: 'Baglanti durumunu net gorur, test eder ve sorun varsa hizla duzeltirsin.',
    canDo: [
      'Connection health bilgilerini kontrol et',
      'Baglanti testini calistir',
      'Reconnect veya remove aksiyonu uygula',
    ],
    keyAreas: ['Baglanti durum karti', 'Hizli aksiyonlar', 'Hata yonlendirme notlari'],
    criticalActions: ['Test connection', 'Reconnect'],
  },
  'automation-builder': {
    title: 'Automation Builder',
    purpose:
      'Node tabanli akislari karmaşaya dusmeden gorup duzenlemeyi saglar.',
    canDo: [
      'Node tiplerini net ayrimla kullan',
      'Secili node detayini duzenle',
      'Akisi test edip kaydet',
    ],
    keyAreas: ['Node tip paneli', 'Flow canvas', 'Node detay paneli'],
    criticalActions: ['Akisi kaydet', 'Flow test et'],
  },
};
