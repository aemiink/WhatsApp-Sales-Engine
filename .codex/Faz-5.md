# WhatsApp Sales Engine — Phase 5 Spec

## 🎯 Faz 5 Amacı

Bu fazın amacı:

> Brand Context Engine tarafından üretilen bağlamı kullanarak, Gemini/OpenAI üzerinden **structured AI decision output** üreten bir karar motoru kurmaktır.

Bu faz sonunda sistem:
- AI provider abstraction ile çalışabilecek
- workspace için resolved brand context’i okuyabilecek
- conversation geçmişini kullanabilecek
- gelen kullanıcı mesajı için structured bir karar üretebilecek
- bu kararı validate edip uygulama katmanına dönebilecek

Bu fazda henüz:
- otomatik outbound reply gönderimi
- lead stage kalıcı güncelleme
- handoff execution
- analytics yazımı

yapılmayacaktır.

---

# 🧱 KAPSAM

## Bu fazda yapılacaklar

- AI provider abstraction implementasyonu
- Gemini primary provider entegrasyonu
- OpenAI secondary provider entegrasyonu
- prompt/context assembly
- structured output schema
- AI decision service
- conversation + brand context + son mesaj birleşimi
- validation / retry / fallback mantığı

---

# 🧠 ANA PRENSİP

Bu fazın ana prensibi şudur:

> AI serbest metin üreten bir kutu değil,
> satış odaklı karar veren bir decision engine olacaktır.

AI’ın çıktısı doğrudan şu sorulara cevap vermelidir:
- Kullanıcının niyeti ne?
- Lead stage ne olmalı?
- İtiraz var mı?
- AI cevap vermeli mi?
- İnsan temsilciye devredilmeli mi?
- En uygun cevap ne?
- Sonraki en iyi aksiyon ne?

---

# 🧩 1. MODÜLLER

## Oluşturulacak / genişletilecek modüller

- ai-brain module
- ai module
- sales-engine module (decision katmanı için temel hazırlık)

---

## 1.1 ai module

Sorumluluklar:
- provider abstraction
- provider factory
- Gemini implementation
- OpenAI implementation
- env/config uyumlu provider seçimi

Önerilen yapı:
- ai.module.ts
- interfaces/
  - ai-provider.interface.ts
- providers/
  - gemini.provider.ts
  - openai.provider.ts
- services/
  - ai-provider-factory.service.ts

---

## 1.2 ai-brain module

Sorumluluklar:
- prompt/context assembly
- AI decision generation
- structured output validation
- retry / fallback logic

Önerilen yapı:
- ai-brain.module.ts
- services/
  - ai-decision.service.ts
  - ai-context-assembler.service.ts
  - ai-decision-validator.service.ts
- prompts/
  - sales-decision.prompt.ts
- schemas/
  - sales-ai-decision.schema.ts

---

# 🔌 2. PROVIDER ABSTRACTION

## Interface

Codex typed bir provider interface tanımlamalıdır.

Örnek mantık:

```ts
interface AiProvider {
  generateSalesDecision(input: AiDecisionInput): Promise<SalesAiDecision>;
}
```

Kurallar:
- domain service provider implementasyon detayını bilmemeli
- provider selection config üzerinden yapılmalı
- primary provider Gemini olacak
- OpenAI secondary/fallback olarak hazır olacak

---

# ⚙️ 3. ENV / CONFIG

Bu fazda gerekli env alanları:

- AI_DEFAULT_PROVIDER
- GEMINI_API_KEY
- GEMINI_MODEL
- OPENAI_API_KEY
- OPENAI_MODEL

## Validation kuralları
- `AI_DEFAULT_PROVIDER=gemini` ise GEMINI_API_KEY zorunlu
- `AI_DEFAULT_PROVIDER=openai` ise OPENAI_API_KEY zorunlu

İsteğe bağlı olarak:
- AI timeout
- max tokens
- retry count

gibi config alanları da eklenebilir.

---

# 🧠 4. AI DECISION INPUT

AI’a gidecek input deterministic ve açık olmalıdır.

## AiDecisionInput

```ts
interface AiDecisionInput {
  workspaceId: string;
  conversation: {
    id: string;
    phoneNumber: string;
    leadStage: string;
    lastMessages: Array<{
      senderType: 'user' | 'ai' | 'human';
      content: string | null;
      timestamp: string | null;
    }>;
  };
  incomingMessage: {
    externalMessageId: string | null;
    text: string | null;
    timestamp: string | null;
  };
  brandContext: ResolvedBrandContext;
  trainingSettings: {
    products: unknown[];
    faq: unknown[];
    rules: unknown[];
    forbiddenResponses: string[];
    handoffRules: string[];
  };
}
```

## Kurallar
- conversation history çok uzun olmamalı
- son 10–20 mesaj yeterli olabilir
- boş/null içerikler temizlenmeli
- AI’a gereksiz raw payload gönderilmemeli

---

# 🧾 5. STRUCTURED AI OUTPUT

AI serbest metin yerine structured karar üretmelidir.

## SalesAiDecision

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

## Ek opsiyonel alanlar
İstenirse şunlar da eklenebilir:
- replyReasoningSummary
- productMentioned
- faqMatched
- ruleViolationRisk

Ama temel yapı yukarıdaki kadar sade ve kararlı olmalıdır.

---

# ✅ 6. OUTPUT VALIDATION

AI çıktısı mutlaka schema validation’dan geçmelidir.

## Kullanılacak araç
- Zod

## Kurallar
- invalid JSON kabul edilmez
- code block / markdown temizlenmeli
- invalid output’ta retry yapılmalı
- çoklu başarısızlıkta typed error dönülmeli

---

# ✍️ 7. PROMPT TASARIMI

## sales-decision.prompt.ts

Prompt şu mantıkta kurulmalıdır:

### Sistem rolü
- satış odaklı müşteri temsilcisi
- markanın tonu dışına çıkmamalı
- yasak cevapları ihlal etmemeli
- gereksiz uydurma yapmamalı

### Verilen bağlam
- resolved brand context
- products/services
- faq
- forbidden responses
- handoff rules
- son conversation geçmişi
- son kullanıcı mesajı

### Görev
- intent belirle
- lead stage belirle
- objection varsa bul
- uygun cevap metni üret
- gerekiyorsa handoff kararı ver
- next best action üret

### Kurallar
- cevap Türkçe olmalı
- marka tonuna uygun olmalı
- ürün/hizmet bilinmiyorsa uydurma yapmamalı
- gerekiyorsa temsilciye yönlendirmeli
- output sadece geçerli JSON olmalı

---

# 🤖 8. GEMINI PROVIDER

## Amaç
Gemini üzerinden structured sales decision üretmek.

## Kurallar
- resmi Gemini API ile entegrasyon
- model env’den okunmalı
- JSON response zorunlu tutulmalı
- timeout / retry mantığı olmalı
- invalid output durumunda yeniden deneme yapılmalı

## Logging
- provider used
- model
- retry count
- success/fail

Ama prompt içeriği ve hassas context loglanmamalı.

---

# 🤖 9. OPENAI PROVIDER

## Amaç
OpenAI üzerinden aynı contract ile karar üretebilmek.

## Kurallar
- Gemini ile aynı domain-level output schema
- env’den model okunmalı
- structured output yaklaşımı desteklenmeli
- fallback veya explicit provider seçimi desteklenmeli

---

# 🧠 10. AI CONTEXT ASSEMBLY

## ai-context-assembler.service.ts

Sorumluluklar:
- conversation geçmişini al
- incoming message’ı al
- brand context’i al
- training settings’i al
- AI input formatına dönüştür

## Kurallar
- çok uzun konuşma geçmişini kısalt
- null/gereksiz alanları çıkar
- deterministic assembly yap

---

# 🔁 11. DECISION FLOW

Bu fazda manuel bir internal flow hazırlanmalıdır.

## Akış
1. inbound user message persisted (Faz 3)
2. conversation bulunur
3. brand context yüklenir (Faz 4)
4. AI decision input oluşturulur
5. provider seçilir
6. AI çağrısı yapılır
7. output validate edilir
8. decision response application layer’a döndürülür

Not:
Bu fazda AI kararı DB’ye kaydetmek opsiyonel olabilir.
Ama en azından response olarak erişilebilir olmalıdır.

---

# 🌐 12. ENDPOINT'LER

Bu fazda tam canlı reply zorunlu değildir.
Ama decision engine’i test etmek için en az bir internal/test endpoint önerilir.

## 12.1 Test AI decision endpoint
POST `/ai/decision/test`

Request örneği:
```json
{
  "conversationId": "uuid",
  "messageId": "uuid"
}
```

Behavior:
- ilgili message + conversation + brand context yüklenir
- AI decision üretilir
- structured karar döndürülür

## Response
```json
{
  "detectedIntent": "price_inquiry",
  "leadStage": "qualified",
  "objectionDetected": null,
  "suggestedReply": "Merhaba, memnuniyetle yardımcı olayım...",
  "shouldSendReply": true,
  "shouldHandoff": false,
  "nextBestAction": "collect_budget",
  "confidence": 0.86
}
```

Not:
Bu endpoint sonraki fazlarda internal service call’a dönüşebilir.

---

# 🧪 13. TESTLER

## Unit tests
- ai context assembly
- prompt builder
- schema validation
- invalid output rejection
- provider factory selection

## Integration tests
- conversation + context + message → decision üretimi
- Gemini provider mock
- OpenAI provider mock
- invalid JSON retry
- missing brand context fail case

---

# ⚠️ 14. ERROR HANDLING

Aşağıdaki durumlar typed şekilde ele alınmalıdır:
- missing provider key
- provider timeout
- invalid AI JSON
- schema validation fail
- missing brand context
- missing message content

Kurallar:
- AI fail olduğunda sistem crash etmemeli
- anlamlı application-level hata dönmeli
- gerekiyorsa retry sonrası fail etsin

---

# 🪵 15. LOGGING

Loglanması gerekenler:
- decision requested
- provider selected
- validation failed
- retry count
- decision generated

Kurallar:
- kullanıcı mesajını tam loglama zorunlu değil
- hassas bağlam ve secret değerleri loglanmamalı

---

# 🚫 16. BU FAZDA YAPILMAYACAKLAR

- otomatik WhatsApp outbound reply
- leadStage DB update
- handoff session create
- analytics event yazımı
- conversation status değişiklikleri

Bu fazın amacı sadece:

> **AI karar üretimini güvenli ve test edilebilir hale getirmek**

---

# ✅ 17. DEFINITION OF DONE

Bu faz tamam sayılır eğer:

- Gemini provider çalışıyorsa
- OpenAI provider aynı contract ile hazırsa
- structured AI decision üretilebiliyorsa
- output schema validation’dan geçiyorsa
- prompt/context assembly doğru çalışıyorsa
- test endpoint ile karar alınabiliyorsa
- retry/error handling düzgünse

---

# 📌 18. CODEX NOTU

Bu fazın amacı:

> **AI'ın ne cevap vereceğine karar veren güvenilir beyni kurmaktır**

Henüz bu karar canlı mesaja dönüşmeyecek.
Bu karar motoru Faz 6’da satış mantığı ve Faz 7’de canlı handoff/reply davranışına bağlanacaktır.
