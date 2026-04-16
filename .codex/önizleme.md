# WhatsApp Sales Engine — Master Codex Spec

Bu doküman, **WhatsApp Sales Engine** uygulamasının backend geliştirmesi için hazırlanmış ana teknik spesifikasyondur.

Bu belgeyi **Codex önce okuyacak**, genel sistemi, sınırları, mimariyi, modülleri, entegrasyon stratejisini ve geliştirme yaklaşımını buradan anlayacaktır.

Bu belgeden sonra geliştirme **fazlara bölünecektir**.
Her faz için ayrı bir `.md` dosyası hazırlanacaktır.
Codex'e herhangi bir fazı yaptırmadan önce ilgili faz dokümanı ayrıca verilecektir.

---

# 1. Ürünün Amacı

WhatsApp Sales Engine, işletmeler için:
- WhatsApp Business üzerinden gelen mesajları toplar
- yapay zeka ile satış odaklı cevaplar üretir
- markanın kendi web sitesi, Instagram hesabı ve tanımlı Brand DNA verilerini kullanarak bağlama uygun cevap verir
- lead qualification yapar
- satış aşamasını takip eder
- gerektiğinde konuşmayı insan temsilciye devreder

Bu sistem bir chatbot değildir.
Bu sistem:

> **brand-aware, sales-oriented, human-assisted AI conversation engine**

olarak tasarlanacaktır.

---

# 2. Ürün Kapsamı

Sistem aşağıdaki problemleri çözmelidir:

1. WhatsApp’tan gelen tüm yeni mesajları toplamak
2. Müşteri niyetini anlamak
3. Markanın tonu ve ürün bilgisine göre cevap üretmek
4. Lead stage belirlemek
5. İtirazları tespit etmek
6. Gerekirse temsilci devri yapmak
7. Konuşma ve performans verisini analiz etmek

---

# 3. Teknoloji Kararları

## Backend
- **NestJS**
- **Prisma ORM**
- **PostgreSQL / Supabase**

## AI Layer
- Primary provider: **Gemini**
- Secondary provider: **OpenAI**

## Messaging Integration
- **WhatsApp Business Cloud API**
- resmi Meta dokümantasyonuna göre entegrasyon

## Context Sources
- Website parsing
- Instagram parsing / analysis
- Brand DNA
- manual product/service/FAQ input

---

# 4. Geliştirme Prensibi

Bu backend **MCP-style integration architecture** ile geliştirilecektir.

Bu şu anlama gelir:

- harici servisler için provider abstraction olacak
- resmi API dokümantasyonları esas alınacak
- entegrasyonlar doğrudan controller içine gömülmeyecek
- servisler modüler ve değiştirilebilir olacak
- retry, error handling, validation, logging düşünülmüş olacak

Yani hedef:

> sadece çalışan MVP değil,
> gelecekte büyüyebilecek sağlam bir altyapı

---

# 5. MCP-Style Mimari Yaklaşım

## 5.1 Integration Layer
Harici servisler için ayrı sağlayıcı katmanları olacak:

- WhatsApp provider
- AI provider
- Website parsing provider
- Instagram analysis provider

## 5.2 Domain Layer
İş mantığı uygulama domain servislerinde olacak:

- conversation orchestration
- AI reply generation
- handoff logic
- lead qualification
- analytics calculations

## 5.3 Persistence Layer
Prisma repository / service katmanı ile veritabanı yönetilecek.

## 5.4 Rules
- Controller ince olacak
- business logic service’te olacak
- harici API çağrıları provider/service katmanında olacak
- typed DTO ve typed return kullanılacak

---

# 6. Ana Modüller

Codex backend’i aşağıdaki ana modüller etrafında inşa etmelidir.

## 6.1 whatsapp module
Sorumluluklar:
- webhook doğrulama
- gelen mesaj alma
- mesaj gönderme
- WhatsApp bağlantı bilgilerini yönetme

## 6.2 conversations module
Sorumluluklar:
- conversation oluşturma
- message persistence
- conversation status takibi
- read models

## 6.3 brand-context module
Sorumluluklar:
- website verisini okuma
- Instagram verisini okuma
- Brand DNA ve manual bilgiyle birleştirme
- AI’ın kullanacağı brand context’i üretme

## 6.4 ai-brain module
Sorumluluklar:
- provider seçimi
- prompt/context assembly
- structured AI output alma
- response validation

## 6.5 sales-engine module
Sorumluluklar:
- intent detection
- lead stage
- objection detection
- next best action
- sales policy enforcement

## 6.6 handoff module
Sorumluluklar:
- insan devri
- AI pause/resume
- temsilci aktif konuşma bilgisi

## 6.7 analytics module
Sorumluluklar:
- response time
- lead quality
- conversion funnel
- drop-off noktaları

## 6.8 settings/training module
Sorumluluklar:
- AI satış eğitimi
- marka tonu
- ürün bilgisi
- FAQ
- yasak cevaplar
- handoff kuralları

---

# 7. Harici Bağlantılar

## 7.1 WhatsApp Business Cloud API
Codex, WhatsApp entegrasyonunu **resmi Meta WhatsApp Cloud API dokümantasyonuna göre** yapmalıdır.

Kritik noktalar:
- webhook verification
- inbound message parsing
- outbound message sending
- message types
- authentication headers
- retries / fail handling

## 7.2 Gemini
AI analiz ve cevap üretiminde primary provider.
Structured output kullanılmalıdır.

## 7.3 OpenAI
Fallback / secondary provider olarak eklenecektir.
Aynı domain-level interface ile çalışmalıdır.

## 7.4 Website parsing
Website’den brand sinyalleri çıkarılacaktır.

## 7.5 Instagram analysis
Instagram’dan ton, içerik dili, caption pattern ve positioning sinyalleri çıkarılacaktır.

---

# 8. Brand-Aware Cevap Mantığı

Bu ürünün ana farkı şudur:

> AI önce markayı öğrenir, sonra cevap verir.

Bu nedenle AI response üretimi sırasında aşağıdaki context birleştirilmelidir:

- website signals
- instagram signals
- brand dna
- products/services
- faq
- forbidden responses
- human handoff rules
- conversation history
- lead stage

AI asla sadece son mesajı baz alarak cevap üretmemelidir.

---

# 9. Conversation Engine Mantığı

Her gelen mesaj için sistem şu akışı izlemelidir:

1. mesaj webhook ile alınır
2. conversation bulunur veya oluşturulur
3. message kaydedilir
4. brand context yüklenir
5. AI/sales logic çalışır
6. structured decision üretilir
7. gerekiyorsa outbound message gönderilir
8. gerekiyorsa handoff tetiklenir
9. analytics/logs güncellenir

---

# 10. Structured AI Output Yaklaşımı

AI doğrudan serbest metin dönmek yerine mümkün olduğunca structured output üretmelidir.

Örnek AI output mantığı:

```ts
interface SalesAiDecision {
  detectedIntent: string;
  leadStage: 'new' | 'qualified' | 'hot' | 'lost' | 'support';
  objectionDetected: string | null;
  suggestedReply: string;
  shouldSendReply: boolean;
  shouldHandoff: boolean;
  nextBestAction: string | null;
  confidence: number;
}
```

Bu karar objesi daha sonra:
- message send
- handoff
- analytics
- UI assistant panel
için kullanılacaktır.

---

# 11. Temel Veri Modeli (Yüksek Seviye)

Bu bölüm tam Prisma şeması değildir. Sadece domain yapısını tarif eder.

## whatsapp_connections
- workspace bazlı WhatsApp bağlantı bilgileri

## conversations
- telefon numarası bazlı konuşmalar
- lead stage
- handoff status

## messages
- gelen ve giden mesajlar
- sender type
- AI / human ayrımı

## brand_contexts
- brand-aware AI için normalize bağlam

## training_settings
- faq
- ürün bilgisi
- satış kuralları
- forbidden answers

## handoff_sessions
- hangi konuşma ne zaman temsilciye geçti

## analytics_events
- ölçüm ve raporlama verileri

---

# 12. Güvenlik ve Operasyonel Kurallar

## 12.1 Secrets
- tokenlar encrypted saklanmalı
- plain text access token tutulmamalı

## 12.2 Webhook Safety
- verification zorunlu
- idempotent message processing olmalı
- duplicate message engellenmeli

## 12.3 Error Handling
- typed error approach
- soft fail / retry mantığı
- harici servis arızaları loglanmalı

## 12.4 Logging
- önemli lifecycle event’leri loglanmalı
- secret ve hassas kullanıcı verileri loglanmamalı

---

# 13. Codex İçin Çalışma Kuralı

Codex bu sistemi tek seferde büyük bir patch olarak üretmemelidir.

Bu geliştirme **fazlara bölünmelidir**.

Her faz için:
- ayrı kapsam
- ayrı `.md` dokümanı
- net giriş / çıkış kriteri
olacaktır.

Codex’e yalnızca ilgili faz verildiğinde o fazın işi yapılmalıdır.

---

# 14. Fazlandırma Mantığı

Planlanan geliştirme fazları aşağıdaki başlıklarda ilerleyecektir.

## Faz 1
Backend foundation + Prisma schema + modül iskeletleri

## Faz 2
WhatsApp bağlantısı + webhook ingestion + outbound message altyapısı

## Faz 3
Conversation persistence + message lifecycle + deduplication

## Faz 4
Brand context ingestion (website + Instagram + Brand DNA + manual settings)

## Faz 5
AI provider abstraction + Gemini/OpenAI structured decision engine

## Faz 6
Sales engine logic (intent, lead stage, objection, next best action)

## Faz 7
Human handoff + agent takeover + AI pause/resume

## Faz 8
Analytics + reporting + operational dashboards backend support

## Faz 9
Client integration support + stabilization + production hardening

Not:
Bu başlıklar şu an master plan seviyesindedir.
Her biri için daha sonra ayrı `.md` faz dokümanı hazırlanacaktır.

---

# 15. Faz Dokümanlarının Rolü

Her faz dokümanında şunlar yer alacaktır:

- o fazın amacı
- hangi dosyalar/modüller etkilenir
- hangi endpointler yazılacak
- hangi tablolar eklenecek
- hangi servisler oluşturulacak
- bu fazda özellikle yapılmayacak şeyler
- test beklentileri
- definition of done

Yani master spec:
- sistemin anayasasıdır

Phase spec:
- uygulanacak görev paketidir

---

# 16. Resmi Dokümantasyon Zorunluluğu

Codex aşağıdaki entegrasyonlarda **resmi dokümantasyonu esas almalıdır**:

- Meta WhatsApp Cloud API
- Meta Webhooks verification
- Gemini API
- OpenAI API

Kütüphane veya blog yazıları yardımcı olabilir; ancak entegrasyon davranışı resmi API belgeleriyle uyumlu olmalıdır.

---

# 17. Kod Kalitesi Beklentisi

Codex’in üreteceği kod:
- modüler
- typed
- test edilebilir
- service-driven
- clean error handling içeren
- production’a yakın düşünülmüş
olmalıdır.

Aşağıdakilerden kaçınılmalıdır:
- controller içinde business logic
- env değerlerini dağınık okumak
- provider kodunu domain logic’e gömmek
- tek dosyada çok fazla sorumluluk toplamak

---

# 18. İlk Okuma Talimatı

Codex bu master belgeyi okuduktan sonra:
- sistemi genel olarak anlamalı
- modülleri ve fazları kavramalı
- tek seferde her şeyi yapmaya çalışmamalı
- yalnızca verilen faz dokümanına göre implementasyon yapmalıdır

---

# 19. Sonuç

Bu sistem:
- generic WhatsApp bot değildir
- yalnızca mesaj cevaplama aracı değildir
- yalnızca CRM değildir

Bu sistem:

> **brand-aware AI sales operating system**

olarak geliştirilecektir.

Bu master spec, geliştirme boyunca ana referans belge olacaktır.

