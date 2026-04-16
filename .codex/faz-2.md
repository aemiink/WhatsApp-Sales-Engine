# WhatsApp Sales Engine — Phase 2 Spec

## 🎯 Faz 2 Amacı

Bu fazın amacı:

> WhatsApp Business Cloud API ile temel bağlantıyı kurmak, webhook ingestion altyapısını oluşturmak ve kontrollü outbound message gönderimini hazırlamaktır.

Bu fazda sistem artık:
- WhatsApp webhook doğrulaması yapabilecek
- gelen WhatsApp event’lerini alabilecek
- temel inbound message payload’larını işleyebilecek
- güvenli şekilde outbound mesaj gönderebilecek

Bu fazda henüz:
- AI cevap üretimi
- satış karar motoru
- brand-aware context assembly
- insan devri

yapılmayacaktır.

---

# 🧱 KAPSAM

## Bu fazda yapılacaklar

- WhatsApp Cloud API resmi dokümantasyonuna göre integration layer kurulumu
- webhook verification endpoint
- webhook ingest endpoint
- inbound payload parse / normalization
- outbound text message send altyapısı
- WhatsApp bağlantı kaydını kullanma
- temel deduplication hazırlığı
- typed error handling
- logging

---

# 📚 RESMİ DOKÜMANTASYON KURALI

Codex bu fazda **resmi Meta WhatsApp Cloud API dokümantasyonunu esas almalıdır**.

Özellikle şu davranışlar resmi belgelere göre uygulanmalıdır:
- webhook verification
- inbound webhook payload structure
- outbound message endpoint
- bearer token kullanımı
- message status / delivery event parsing

Blog yazıları veya üçüncü taraf örnekler referans olabilir ama kaynak gerçekliği için resmi Meta dökümanları esas alınmalıdır.

---

# 🔧 1. MODÜL KAPSAMI

## whatsapp module genişletilecek

İçerik:
- controllers/
  - whatsapp-webhook.controller.ts
  - whatsapp-messages.controller.ts
- services/
  - whatsapp-webhook.service.ts
  - whatsapp-message-parser.service.ts
  - whatsapp-message-sender.service.ts
  - whatsapp-connection.service.ts
  - whatsapp-dedup.service.ts
- dto/
- providers/
  - meta-whatsapp.provider.ts

---

# 🔐 2. ENV VE CONFIG

Aşağıdaki env alanları bu faz için gereklidir:

- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID (opsiyonel ama önerilir)
- WHATSAPP_WEBHOOK_VERIFY_TOKEN
- META_GRAPH_API_VERSION

Not:
- Eğer bağlantı bazlı token tutuluyorsa global token yerine connection-level token mantığı ileride genişletilebilir.
- Bu fazda MVP olarak tek bağlantı veya workspace-level bağlantı kabul edilebilir.

Env validation eklenmelidir.
Eksik kritik env varsa uygulama anlamlı hata vermelidir.

---

# 🗄️ 3. VERİ MODELİ GÜNCELLEMESİ

Faz 1’de oluşturulan `whatsapp_connections` tablosu genişletilmelidir.

## whatsapp_connections
Alanlar:
- id
- workspaceId
- phoneNumber
- accessTokenEncrypted
- phoneNumberId
- businessAccountId (nullable)
- webhookVerifyToken (nullable)
- metadataJson
- createdAt
- updatedAt

Not:
- Eğer tek global connection mantığı kullanılıyorsa bile tablo future-proof tutulmalıdır.
- access token plain text saklanmamalı.

---

# 🌐 4. WEBHOOK VERIFICATION

## Endpoint
### GET `/webhooks/whatsapp`

Sorumluluk:
- Meta verification challenge akışını karşılamak
- query param’ları doğrulamak
- verify token eşleşirse challenge döndürmek
- eşleşmezse 403 dönmek

Beklenen query param’lar:
- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

Kurallar:
- `hub.mode === subscribe` kontrol edilmeli
- verify token env veya connection/config üzerinden okunmalı
- başarısız durumda anlamlı log bırakılmalı

---

# 📨 5. WEBHOOK INGEST ENDPOINT

## Endpoint
### POST `/webhooks/whatsapp`

Sorumluluk:
- WhatsApp webhook event payload’ını almak
- temel payload validation yapmak
- duplicate event kontrolü için normalize event key üretmek
- parse edilmiş event’i uygulama içinde işlenebilir formata çevirmek
- şimdilik temel persistence veya logging’e hazırlamak

Not:
Bu fazda tam conversation processing yapılmayacak.
Ama webhook alınmalı ve normalize edilmelidir.

---

# 🧩 6. PAYLOAD PARSING

## whatsapp-message-parser.service.ts

Sorumluluk:
Resmi webhook payload içinden aşağıdaki alanları normalize etmek:

- event type
- message id
- from phone
- timestamp
- message type
- text body (varsa)
- contact/profile info (varsa)
- status event (delivered/read/sent) ise ilgili alanlar

## Normalize model örneği

```ts
interface NormalizedWhatsAppEvent {
  eventType: 'message' | 'status' | 'unknown';
  externalMessageId: string | null;
  fromPhoneNumber: string | null;
  timestamp: string | null;
  messageType: string | null;
  textBody: string | null;
  rawPayload: unknown;
}
```

Kurallar:
- bilinmeyen payload shape crash etmemeli
- eventType unknown olabilir
- parse edilemeyen alanlar null bırakılabilir
- rawPayload tutulmalı

---

# 🧠 7. DEDUP / IDEMPOTENCY HAZIRLIĞI

Bu fazda tam duplicate koruması minimal seviyede hazırlanmalıdır.

## whatsapp-dedup.service.ts

Amaç:
- inbound event için unique dedup key üretmek
- tekrar eden event’lerin ileride çift işlenmesini engelleyecek altyapıyı hazırlamak

Öneri:
- externalMessageId varsa onu kullan
- yoksa fallback composite key oluştur

Not:
Bu fazda tam DB-level dedup tablo zorunlu değil.
Ama servis ve kullanım yeri hazırlanmalıdır.

---

# 📤 8. OUTBOUND MESSAGE SEND

## Endpoint
### POST `/whatsapp/messages/send`

Amaç:
Manuel test için belirli bir numaraya WhatsApp text message gönderebilmek.

Request body örneği:
```json
{
  "to": "905551112233",
  "text": "Merhaba, bu bir test mesajıdır."
}
```

## whatsapp-message-sender.service.ts

Sorumluluk:
- resmi Meta WhatsApp send endpoint’ini çağırmak
- bearer token kullanmak
- phone_number_id ile doğru endpoint’e gitmek
- typed response döndürmek
- hata durumunda typed exception üretmek

Bu fazda sadece **text message** yeterlidir.
Template message, image, interactive message ileriki fazlara bırakılabilir.

---

# 🔌 9. PROVIDER ABSTRACTION

Faz 1’de oluşturulan WhatsApp provider interface bu fazda implement edilmelidir.

## Interface
```ts
interface WhatsAppProvider {
  sendTextMessage(input: { to: string; text: string }): Promise<any>;
  verifyWebhook(input: any): { ok: boolean; challenge?: string };
}
```

## Implementasyon
- `meta-whatsapp.provider.ts`

Kurallar:
- resmi endpoint kullan
- token ve phone number id config’den veya connection service’ten gelsin
- domain service provider detayını bilmesin

---

# 🧪 10. TEST EDİLEBİLİR MANUEL AKIŞ

Bu faz sonunda geliştirici şunları test edebilmelidir:

1. GET `/webhooks/whatsapp` ile challenge doğrulaması
2. POST `/webhooks/whatsapp` ile örnek payload alımı
3. POST `/whatsapp/messages/send` ile test mesajı gönderimi

Yani sistem gerçek Meta bağlantısıyla minimum canlı konuşma altyapısını kurmuş olmalıdır.

---

# 🧱 11. CONNECTION SERVICE

## whatsapp-connection.service.ts

Sorumluluk:
- aktif WhatsApp bağlantısını resolve etmek
- access token’ı güvenli çözmek
- phoneNumberId okumak
- workspace bazlı bağlantı mantığını ileride destekleyecek şekilde tasarlamak

Bu fazda basit MVP yaklaşımı kabul edilebilir:
- tek aktif connection
veya
- workspace bazlı tek connection

Ama servis future-proof olmalıdır.

---

# 🪵 12. LOGGING

Loglanması gerekenler:
- webhook verification request
- verification success/fail
- inbound webhook alındı
- outbound message send denemesi
- outbound success/fail
- parse edilemeyen payload warning

Kurallar:
- access token loglama
- hassas telefon verisini maskeli loglama tercih et

---

# ⚠️ 13. ERROR HANDLING

Aşağıdaki durumlar typed ve anlaşılır ele alınmalıdır:

- missing verify token
- invalid webhook challenge
- invalid inbound payload
- missing access token
- missing phone number id
- Meta API error
- unauthorized / forbidden
- rate limit benzeri hata yanıtları

Hata mesajları geliştirici dostu olmalıdır.

---

# 🔒 14. GÜVENLİK

- access token encrypted saklanmalı
- webhook verify token plain config olsa bile güvenli erişilmeli
- controller içinde secret string hardcode edilmemeli
- outbound endpoint mümkünse auth-protected düşünülmeli (en azından internal kullanım notu düşülmeli)

---

# 🧪 15. TESTLER

Minimum test kapsamı:

## Unit tests
- webhook verification logic
- payload parser
- dedup key generation
- outbound request payload builder

## Integration tests
- GET webhook challenge success/fail
- POST webhook with sample inbound message
- POST send text message (mocked provider)
- missing config fail case

Gerçek Meta API’ye test zorunlu değil.
Provider/mock üzerinden test yeterlidir.

---

# 🚫 16. BU FAZDA YAPILMAYACAKLAR

- conversation DB persistence
- message-to-conversation eşleme
- AI reply generation
- sales intent detection
- handoff logic
- analytics
- template messages
- media messages

Bunlar sonraki fazlara bırakılacaktır.

---

# ✅ 17. DEFINITION OF DONE

Bu faz tamamlanmış sayılır eğer:

- WhatsApp webhook verify endpoint çalışıyorsa
- webhook ingest endpoint payload alıp normalize edebiliyorsa
- outbound text message send endpoint çalışıyorsa
- provider abstraction gerçek Meta provider ile implement edilmişse
- env/config validation eklenmişse
- logging ve typed error handling varsa
- temel unit/integration testler yazılmışsa

---

# 📌 18. CODEx NOTU

Codex bu fazda sadece WhatsApp bağlantı katmanını kurmalıdır.

Bu fazın amacı:
> **mesaj alma ve gönderme omurgasını kurmak**

Henüz AI veya satış mantığı eklenmemelidir.

Temiz, modüler ve resmi dokümantasyona sadık bir integration layer beklenmektedir.

