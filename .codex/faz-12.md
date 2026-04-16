# WhatsApp Sales Engine — Phase 12 Spec

## 🎯 Faz 12 Amacı

> Ürünün son kullanıcı deneyimini tamamlamak için **sayfa bazlı açıklayıcı pop-up / help overlays** eklemek ve aynı zamanda **mail + real-time notifications** altyapısını kurmak.

Bu fazın amacı:
- kullanıcıya sayfaların ne işe yaradığını ilk kullanımda net anlatmak
- operasyonel olaylar için anlık bildirim sistemi kurmak
- e-posta bildirimleri ve şablonlarını oluşturmak
- ürünü deneyim ve iletişim açısından tamamlamaktır

Bu faz, WhatsApp Sales Engine için son olgunlaştırma fazıdır.

---

# 🧱 KAPSAM

Bu faz iki ana parçadan oluşur:

## 1. UI/UX Yardım Katmanı
- sayfa bazlı açıklayıcı pop-up / help system
- bir kerelik gösterim mantığı
- tekrar açmak için soru işareti butonu

## 2. Bildirim Katmanı
- real-time in-app notifications
- e-posta bildirimleri
- Resend entegrasyonu
- mail template yapısı

---

# 🧠 ANA PRENSİP

> Kullanıcı neye baktığını anlamalı, kritik olayları da anında görmelidir.

Bu fazın sonunda sistem:
- yeni kullanıcıyı yönlendirir
- sayfaları açıklar
- önemli olayları anlık gösterir
- gerektiğinde e-posta ile bilgilendirir

---

# 1. SAYFA BAZLI POP-UP / HELP SYSTEM

## Amaç
Her ana sayfada kullanıcıya o ekranın ne yaptığını ilk kullanımda açıklamak.

## Davranış
- pop-up / help overlay **ilk girişte bir kez** görünür
- kullanıcı kapattığında tekrar otomatik çıkmaz
- aynı sayfada bulunan **soru işareti ikonu** ile tekrar manuel açılabilir

---

## Kapsanan Sayfalar
En az şu sayfalarda desteklenmeli:

- AI Setup / Onboarding
- Dashboard / Overview
- Live Chat
- AI Knowledge / Training
- Lead Management
- Analytics
- WhatsApp Connection
- Automation Builder (varsa)

---

## İçerik Mantığı
Her sayfanın pop-up içeriği kısa, net ve yönlendirici olmalıdır.

Örnek içerik yapısı:
- Sayfanın amacı
- Burada ne yapabilirsin?
- En önemli 2–3 alan nedir?
- Hangi aksiyonlar kritik?

Örnek:
### Live Chat
- Bu ekran canlı konuşmaları yönetir
- AI önerilerini sağ panelde görürsün
- Temsilci devri ve AI modu buradan kontrol edilir

---

## Teknik Davranış

### One-time show mantığı
Aşağıdaki yaklaşımlardan biri seçilebilir:

#### Seçenek A — localStorage bazlı
- her sayfa için bir anahtar
- örn: `wse_help_seen_live_chat=true`

#### Seçenek B — backend/user preference bazlı (tercih edilen, eğer auth hazırsa)
- user_preferences veya ui_preferences tablosunda tutulur

Bu fazda minimum beklenti:
- localStorage ile kesin çalışmalı
- auth/workspace hazır ise backend persistence opsiyonel olarak eklenebilir

---

## UI Davranışı
- her ilgili sayfada sağ üst veya uygun bir noktada `?` yardım ikonu olmalı
- bu ikona tıklayınca pop-up tekrar açılmalı
- pop-up minimal ama premium görünmeli
- overlay tüm ekranı boğmamalı
- close / "bir daha gösterme" davranışı net olmalı

---

# 2. UI HELP SYSTEM KOD ORGANİZASYONU

## Client tarafında önerilen yapı

```text
client/
  components/
    help/
      PageHelpTrigger.tsx
      PageHelpModal.tsx
      usePageHelp.ts
      help-content.ts
```

## Beklenen parçalar
- reusable help modal component
- reusable trigger component
- page key bazlı state hook
- merkezi help content mapping

---

# 3. REAL-TIME NOTIFICATIONS

## Amaç
Kritik operasyonel olayları kullanıcıya anında göstermek.

## Bildirim tipleri
- yeni sıcak lead oluştu
- handoff başladı
- AI reply başarısız oldu
- WhatsApp connection hata verdi
- yeni mesaj geldi (opsiyonel)
- analytics insight hazır

---

## Kanal
İlk sürüm için:
- in-app real-time notifications

Tercih edilen teknik seçenekler:
- WebSocket
- Server-Sent Events (SSE)

Eğer mevcut yapıya daha uygunsa:
- polling fallback de düşünülebilir

Ama hedef:
> **gerçek zamanlı his veren bir bildirim sistemi**

---

## Bildirim modeli

Örnek tip:

```ts
interface AppNotification {
  id: string;
  workspaceId: string;
  userId?: string | null;
  type: 'lead_hot' | 'handoff_started' | 'reply_failed' | 'connection_error' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}
```

---

## Beklenen davranış
- notification bell / panel olmalı
- unread count görünmeli
- notification listesi okunabilir olmalı
- okundu işaretleme desteklenmeli
- kritik notification click ile ilgili sayfaya yönlendirme yapabilmeli

---

# 4. BACKEND NOTIFICATION ALTYAPISI

## Yeni/ek modül
- notifications module

Önerilen yapı:
- notifications.module.ts
- services/
  - notifications.service.ts
  - realtime-notifications.service.ts
  - email-notifications.service.ts
- controllers/
  - notifications.controller.ts

---

## Veri modeli
Yeni tablo önerisi:

### notifications
Alanlar:
- id
- workspaceId
- userId (nullable)
- type
- title
- message
- isRead
- payloadJson
- createdAt
- updatedAt

Opsiyonel:
- emailSentAt
- channel (in_app | email | both)

---

## Endpoints
Minimum:
- GET `/notifications`
- PATCH `/notifications/:id/read`
- PATCH `/notifications/read-all`

Opsiyonel:
- GET `/notifications/unread-count`

---

# 5. HANGİ OLAYLAR NOTIFICATION ÜRETİR?

Aşağıdaki olaylar notification üretmeye uygun kabul edilir:

- hot lead tespit edildi
- human handoff başlatıldı
- AI cevap veremedi / fail oldu
- WhatsApp bağlantısı koptu veya hata verdi
- kritik sistem uyarısı oluştu
- günlük/haftalık performans özeti hazırlandı

Notification üretimi mevcut event tracking / execution flow ile bağlanmalıdır.

---

# 6. E-POSTA BİLDİRİMLERİ

## Amaç
Kritik olayları yalnızca uygulama içinde değil, e-posta ile de bildirmek.

## Sağlayıcı
- **Resend** kullanılacak

Codex Resend entegrasyonunu resmi dokümantasyona göre yapmalıdır.

---

## Env Alanları
Önerilen env:
- RESEND_API_KEY
- EMAIL_FROM_ADDRESS
- APP_BASE_URL

Env validation eklenmeli.

---

## E-posta gönderim senaryoları
İlk sürüm için önerilen bildirim türleri:

- Hot lead detected
- Human handoff started
- WhatsApp connection error
- Daily summary / digest
- Weekly performance summary

Not:
Her notification e-posta olmak zorunda değil.
Kanal seçimi kural bazlı olmalı.

---

# 7. MAIL TEMPLATE SİSTEMİ

## Amaç
Resend üzerinden gönderilecek e-postaların tutarlı, markalı ve genişletilebilir template yapısına sahip olması.

## Beklenen yapı

```text
server/
  src/
    modules/
      notifications/
        templates/
          hot-lead-email.template.tsx
          handoff-started-email.template.tsx
          connection-error-email.template.tsx
          daily-summary-email.template.tsx
          weekly-summary-email.template.tsx
```

Eğer React email yaklaşımı uygunsa kullanılabilir.
Alternatif olarak HTML template builder da kullanılabilir.

---

## Template içerik beklentisi
Her mail template şunları içermeli:
- net başlık
- kısa açıklama
- kritik detaylar
- ilgili ekrana yönlendiren CTA linki
- sade ve profesyonel görünüm

Örnek:
### Hot Lead Email
- Başlık: Yeni sıcak lead tespit edildi
- İçerik: Kullanıcı X, ürün Y ile ilgileniyor
- CTA: Konuşmayı aç

---

# 8. DAILY / WEEKLY SUMMARY

## Amaç
Ajans veya müşteri tarafında yöneticilerin sisteme girmeden özet alabilmesi.

## İçerik
- toplam yeni konuşma
- AI handled count
- handoff sayısı
- hot lead sayısı
- dikkat çeken itiraz tipi
- conversion summary

Bu özetler cron/scheduled job ile ileride genişletilebilir.
Bu fazda temel yapı ve template yeterlidir.

---

# 9. CLIENT UI ENTEGRASYONU

## Gerekenler
- üst navigation’da notification bell
- unread badge
- dropdown/panel liste
- notification click action
- page help trigger icon (`?`) görünür olmalı

## Help + notifications birlikte düşünülmeli
- help ayrı bir yardımcı katman
- notifications ayrı bir olay katmanı

Birbirine karışmamalı.

---

# 10. STATE / PERSISTENCE KURALLARI

## Help pop-up state
Minimum:
- localStorage ile per-page one-time gösterim

Opsiyonel (eğer auth/workspace hazırsa):
- backend preference persistence

## Notification state
- backend source of truth
- isRead durumu DB’de tutulmalı

---

# 11. TESTLER

## Unit tests
- help content resolver
- localStorage help state logic
- notification mapping
- email template rendering

## Integration tests
- notification create → list → mark read
- real-time event → in-app notification
- resend mail send service (mocked)
- critical event → email notification trigger

## UI / E2E kontrol listesi
- sayfaya ilk girişte pop-up açılıyor mu
- kapatınca tekrar çıkmıyor mu
- soru işareti ile tekrar açılabiliyor mu
- notification bell unread count güncelleniyor mu
- email trigger senaryoları çalışıyor mu

---

# 12. ERROR HANDLING

## Help system
- localStorage erişim sorunu olursa sessiz fallback

## Notifications
- real-time channel düşerse polling fallback düşünülebilir
- email gönderimi fail olursa in-app notification yine oluşturulmalı
- resend error’ları typed loglanmalı

---

# 13. LOGGING

Loglanması gerekenler:
- notification created
- notification read
- email send requested
- email sent / failed
- realtime push attempted / failed

Kurallar:
- hassas kullanıcı verileri mail loglarında açık yazılmamalı
- API key / secrets loglanmamalı

---

# 14. BU FAZDA YAPILMAYACAKLAR

- tam kapsamlı onboarding tour sistemi
- multi-step coach marks zinciri
- gelişmiş notification preference center
- sms/push notification entegrasyonları

Bu fazın odağı:
> **temel ama güçlü yardım + bildirim katmanını tamamlamak**

---

# ✅ DEFINITION OF DONE

Bu faz tamamlanmış sayılır eğer:

- her ana sayfada bir kerelik açıklayıcı pop-up varsa
- pop-up tekrar otomatik çıkmıyor ama `?` ile açılabiliyorsa
- in-app notification sistemi çalışıyorsa
- unread/read akışı çalışıyorsa
- Resend ile e-posta gönderimi çalışıyorsa
- temel mail template’leri oluşturulmuşsa
- kritik olaylar için hem in-app hem e-posta notification üretilebiliyorsa

---

# 📌 CODEX NOTU

Bu fazın amacı:

> **ürünü son kullanıcı için tamamlamak**

Kullanıcı artık:
- sayfaları anlar
- sistemin önemli olaylarını kaçırmaz
- kritik satış/handoff anlarında hem uygulama içinde hem e-posta ile bilgilendirilir

Bu faz ile birlikte WhatsApp Sales Engine deneyim, iletişim ve operasyon tarafında olgun bir seviyeye ulaşacaktır.

