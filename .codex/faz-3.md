# WhatsApp Sales Engine — Phase 3 Spec

## 🎯 Faz 3 Amacı

Bu fazın amacı:

> WhatsApp’tan gelen normalize edilmiş event’leri kalıcı hale getirmek, conversation (konuşma) modelini oluşturmak ve message lifecycle’ı yönetmektir.

Bu faz sonunda sistem:
- inbound mesajları veritabanına kaydeder
- telefon numarasına göre conversation oluşturur/bağlar
- message geçmişini tutar
- idempotent (tekrarsız) işleme altyapısını kurar

Bu fazda henüz:
- AI cevap üretimi
- satış (intent/lead stage) kararları
- brand-aware context kullanımı
- insan devri

yapılmayacaktır.

---

# 🧱 KAPSAM

## Bu fazda yapılacaklar

- inbound event → conversation + message eşleme
- conversations ve messages tablolarının aktif kullanımı
- idempotent message processing (dedup)
- message status event’lerinin işlenmesi (sent/delivered/read)
- basit read endpoint’leri (listeleme)
- temel transaction/consistency yaklaşımı
- logging ve hata yönetimi

---

# 🗄️ 1. VERİ MODELİ GÜNCELLEMELERİ

Faz 1’de oluşturulan tablolar kullanılacaktır. Gerekirse küçük eklemeler yapılabilir.

## conversations
Alanlar (mevcut + öneri):
- id (uuid)
- workspaceId
- phoneNumber (string, index)
- leadStage (enum, default: new)
- status (enum, default: active)
- lastMessageAt (timestamp, nullable)
- createdAt
- updatedAt

Index önerisi:
- (workspaceId, phoneNumber) unique veya composite index

---

## messages
Alanlar (mevcut + öneri):
- id (uuid)
- conversationId (fk)
- externalMessageId (string, nullable, unique where not null)
- senderType (user | ai | human)
- direction (inbound | outbound)
- messageType (text | unknown | status)
- content (text, nullable)
- rawPayload (json)
- status (sent | delivered | read | received | unknown)
- timestamp (timestamp, nullable)
- createdAt

Index önerisi:
- externalMessageId unique (null değilse)
- (conversationId, createdAt)

---

## Yeni tablo (opsiyonel ama önerilir)
### inbound_event_logs
Amaç: ham webhook event’lerini saklamak (debug ve dedup için)

Alanlar:
- id
- dedupKey (string, unique)
- rawPayload (json)
- receivedAt

---

# 🔁 2. CONVERSATION RESOLUTION

## Amaç
Her inbound mesajın doğru conversation’a bağlanması.

## Kural
- ana anahtar: **phoneNumber**

## Akış
1. normalized event içinden phoneNumber al
2. workspaceId belirle (MVP’de sabit olabilir)
3. conversation var mı kontrol et
4. yoksa yeni conversation oluştur
5. varsa mevcut conversation’ı kullan

## Service
`conversations.service.ts`

Fonksiyon örneği:
```ts
findOrCreateByPhone(workspaceId: string, phone: string): Promise<Conversation>
```

---

# 📨 3. MESSAGE PERSISTENCE

## Amaç
Inbound ve outbound tüm mesajların kaydedilmesi.

## Akış (inbound)
1. webhook → normalized event
2. dedup check
3. conversation resolve
4. message create
5. conversation.lastMessageAt güncelle

## Service
`messages.service.ts`

Fonksiyonlar:
- createInboundMessage(...)
- createOutboundMessage(...)

---

# 🔁 4. IDEMPOTENCY / DEDUP

## Amaç
Aynı webhook event’inin tekrar işlenmesini engellemek.

## Strateji

### 1. externalMessageId varsa
- unique constraint ile engelle

### 2. yoksa
- dedupKey oluştur (örn: phone + timestamp + content hash)
- inbound_event_logs tablosuna yaz
- duplicate ise ignore et

## Service
`whatsapp-dedup.service.ts`

Fonksiyon:
```ts
isDuplicate(event: NormalizedWhatsAppEvent): Promise<boolean>
```

Kurallar:
- duplicate ise downstream işlem yapılmaz
- warning log bırakılır

---

# 📡 5. STATUS EVENT HANDLING

WhatsApp webhook sadece mesaj değil, status event’leri de gönderir.

## Event türleri
- sent
- delivered
- read

## Yapılacaklar
- ilgili externalMessageId ile message bulun
- message.status güncelle

## Service
`message-status.service.ts`

---

# 🧠 6. WEBHOOK → DOMAIN FLOW

Faz 2’de kurulan webhook artık domain’e bağlanır.

## whatsapp-webhook.service.ts

Akış:
1. payload al
2. parse et (Phase 2 parser)
3. dedup check
4. eventType switch

### Eğer message ise:
- conversation resolve
- message persist

### Eğer status ise:
- status update

### bilinmeyen event:
- log + ignore

---

# 🌐 7. READ ENDPOINT’LERİ

Basit client entegrasyonu için read endpoint’leri ekle.

## 7.1 Conversations list
GET `/conversations`

Response:
- id
- phoneNumber
- leadStage
- lastMessageAt

---

## 7.2 Conversation detail
GET `/conversations/:id`

Response:
- conversation info
- messages list (chronological)

---

## 7.3 Messages pagination
Opsiyonel:
- cursor / limit desteği

---

# 🧪 8. TESTLER

## Unit tests
- conversation resolve (existing/new)
- dedup logic
- message create
- status update

## Integration tests
- webhook inbound → message persisted
- duplicate webhook → ignored
- status event → message status updated
- conversations list endpoint
- conversation detail endpoint

---

# 🪵 9. LOGGING

Loglanması gerekenler:
- inbound event received
- conversation created
- message persisted
- duplicate detected
- status updated

Kurallar:
- hassas veri maskele
- raw payload debug seviyesinde saklanabilir

---

# ⚠️ 10. ERROR HANDLING

Durumlar:
- missing phone number
- invalid payload
- db write fail
- constraint violation

Kurallar:
- crash etme
- meaningful error log
- webhook endpoint 200 dönebilir (retry storm önlemek için) ama iç log kritik

---

# 🚫 11. BU FAZDA YAPILMAYACAKLAR

- AI response generation
- sales intent detection
- leadStage otomatik güncelleme
- brand context kullanımı
- human handoff
- outbound otomatik reply

---

# ✅ 12. DEFINITION OF DONE

Bu faz tamam sayılır eğer:

- inbound WhatsApp mesajları DB’ye kaydediliyorsa
- conversation doğru şekilde resolve ediliyorsa
- duplicate event’ler işlenmiyorsa
- message status event’leri güncelleniyorsa
- conversation ve message read endpoint’leri çalışıyorsa
- logging ve error handling düzgünse

---

# 📌 13. CODEX NOTU

Bu fazın amacı:

> **mesajları güvenli, tutarlı ve izlenebilir şekilde saklamak**

AI veya satış mantığına geçmeden önce conversation altyapısı sağlam olmalıdır.

