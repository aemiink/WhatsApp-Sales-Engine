# WhatsApp Sales Engine — Phase 1 Spec

## 🎯 Faz 1 Amacı

Bu fazın amacı:

> Backend’in temel iskeletini kurmak ve tüm sistemin üzerine inşa edileceği foundation’ı oluşturmaktır.

Bu fazda:
- veri modeli (Prisma) kurulacak
- temel NestJS modül yapısı oluşturulacak
- env + config + validation sistemi kurulacak
- MCP-style mimari için temel abstraction hazırlanacak

Bu fazda **hiçbir harici API entegrasyonu yapılmayacaktır**.

---

# 🧱 KAPSAM

## Bu fazda yapılacaklar:

- Prisma setup
- temel tablolar
- NestJS module scaffold
- config module
- env validation
- base provider abstraction (interface seviyesinde)

---

# 🗄️ 1. PRISMA SETUP

## Yapılacaklar

- Prisma kurulumu
- PostgreSQL bağlantısı (DATABASE_URL üzerinden)
- `prisma/schema.prisma` oluştur

---

## Temel Tablolar

### 1. conversations

Alanlar:
- id (uuid)
- workspaceId
- phoneNumber
- leadStage (enum)
- status (enum)
- createdAt
- updatedAt

---

### 2. messages

Alanlar:
- id (uuid)
- conversationId (relation)
- senderType (user | ai | human)
- content
- rawPayload (json)
- createdAt

---

### 3. brand_contexts

Alanlar:
- id
- workspaceId
- tone
- salesStyle
- dataJson (json)
- createdAt

---

### 4. training_settings

Alanlar:
- id
- workspaceId
- faqJson
- productsJson
- rulesJson
- createdAt

---

### 5. whatsapp_connections

Alanlar:
- id
- workspaceId
- phoneNumber
- accessTokenEncrypted
- metadataJson
- createdAt

---

### 6. handoff_sessions (boş ama hazır)

Alanlar:
- id
- conversationId
- startedAt
- endedAt

---

### 7. analytics_events (placeholder)

Alanlar:
- id
- workspaceId
- type
- payloadJson
- createdAt

---

## Enumlar

### LeadStage
- new
- qualified
- hot
- lost
- support

### ConversationStatus
- active
- closed

### SenderType
- user
- ai
- human

---

# 🧩 2. NESTJS MODÜL YAPISI

## Oluşturulacak modüller

- app module
- config module
- database module
- conversations module
- brand-context module
- ai-brain module
- sales-engine module
- whatsapp module (şimdilik boş)
- handoff module (şimdilik boş)
- analytics module (şimdilik boş)

---

## Kurallar

- her modül kendi klasöründe olacak
- controller + service + dto yapısı olacak
- business logic service’te olacak

---

# ⚙️ 3. CONFIG & ENV SYSTEM

## Yapılacaklar

- ConfigModule (NestJS)
- merkezi env okuma
- typed config service

---

## Env Validation

Validation yapılmalı:

- DATABASE_URL zorunlu
- AI_DEFAULT_PROVIDER kontrol edilmeli

Kurallar:
- gemini ise GEMINI_API_KEY gerekli
- openai ise OPENAI_API_KEY gerekli

---

# 🔌 4. MCP-STYLE ABSTRACTION (TEMEL)

## Amaç

İleride kullanılacak provider yapısı için temel interface’leri oluştur.

---

## AI Provider Interface

```ts
interface AiProvider {
  generateResponse(input: any): Promise<any>;
}
```

---

## WhatsApp Provider Interface

```ts
interface WhatsAppProvider {
  sendMessage(input: any): Promise<any>;
}
```

---

## Kurallar

- bu fazda implement ETME
- sadece interface + boş provider class oluştur

---

# 🧠 5. BASE SERVICE PATTERN

Her modülde:
- service class olacak
- repository logic service içinde olacak

---

# 🧪 6. TEST / DOĞRULAMA

Minimum kontrol:

- server ayağa kalkıyor mu
- prisma tabloları oluştu mu
- config validation çalışıyor mu
- modüller import hatası vermiyor mu

---

# 🚫 BU FAZDA YAPILMAYACAKLAR

- WhatsApp API entegrasyonu
- webhook
- AI çağrıları
- website parsing
- Instagram parsing
- message processing

---

# ✅ DEFINITION OF DONE

Bu faz tamam sayılır eğer:

- Prisma schema hazır
- DB tabloları oluşmuş
- NestJS modülleri scaffold edilmiş
- Config + env validation çalışıyor
- Provider interface’leri tanımlanmış
- Uygulama sorunsuz ayağa kalkıyor

---

# 📌 NOT

Bu faz sadece temel oluşturur.
Gerçek iş mantığı Faz 2 ve sonrası ile başlayacaktır.

Codex bu fazda minimal ama temiz foundation kurmalıdır.

