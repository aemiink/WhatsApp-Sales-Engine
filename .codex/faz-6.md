# WhatsApp Sales Engine — Phase 6 Spec

## 🎯 Faz 6 Amacı

> AI Decision Engine (Faz 5) çıktısını **satış kuralları ve politika katmanı** ile zenginleştirerek nihai eyleme dönüştürmek.

Bu faz sonunda sistem:
- intent taxonomy kullanır
- lead stage’i kurallarla normalize eder
- objection tespitini işler
- next-best-action üretir
- reply/handoff kararını policy ile netleştirir

Henüz bu fazda:
- otomatik WhatsApp mesaj gönderimi
- DB’ye kalıcı leadStage yazımı (opsiyonel flag dışında)

yapılmayacaktır.

---

# 🧱 KAPSAM

- sales-engine module implementasyonu
- intent taxonomy ve mapping
- lead stage policy
- objection handling policy
- next-best-action kütüphanesi
- decision post-processing (AI → SalesDecision)

---

# 🧠 ANA PRENSİP

> AI önerir, Sales Engine **karara bağlar**.

AI çıktısı tek başına yeterli değildir; kurallar ve iş politikalarıyla son hale getirilir.

---

# 🧩 MODÜLLER

## sales-engine module

Dosyalar:
- sales-engine.module.ts
- services/
  - sales-decision.service.ts
  - intent-mapper.service.ts
  - lead-stage-policy.service.ts
  - objection-policy.service.ts
  - action-recommender.service.ts
- constants/
  - intents.ts
  - lead-stages.ts
  - actions.ts

---

# 🧾 INTENT TAXONOMY

## Standart intent’ler
- price_inquiry
- product_inquiry
- general_info
- support
- appointment
- comparison
- objection_price
- objection_trust
- objection_delay
- unknown

## intent-mapper
AI’dan gelen serbest intent’i bu listeye map et.

---

# 🧭 LEAD STAGE POLICY

## LeadStage enum
- new
- qualified
- hot
- lost
- support

## Kurallar (örnek)
- price_inquiry → en az qualified
- appointment talebi → hot
- support intent → support
- strong objection + disengage → lost

Servis: `lead-stage-policy.service.ts`

---

# 🛑 OBJECTION POLICY

## Türler
- price
- trust
- timing
- unknown

AI çıktısı normalize edilir ve uygun strateji seçilir.

Servis: `objection-policy.service.ts`

---

# 🎯 NEXT BEST ACTION

## Aksiyon seti
- ask_budget
- suggest_product
- offer_discount
- provide_proof
- book_appointment
- escalate_to_human
- send_catalog
- ask_clarification

Servis: `action-recommender.service.ts`

Kurallar:
- intent + stage + objection → action
- deterministic fallback olmalı

---

# 🔁 DECISION POST-PROCESSING

## Girdi
`SalesAiDecision` (Faz 5)

## Çıktı
```ts
interface FinalSalesDecision {
  intent: string;
  leadStage: 'new' | 'qualified' | 'hot' | 'lost' | 'support';
  objection: string | null;
  suggestedReply: string;
  shouldSendReply: boolean;
  shouldHandoff: boolean;
  nextBestAction: string | null;
  confidence: number;
}
```

## Adımlar
1. intent map et
2. lead stage policy uygula
3. objection normalize et
4. next action hesapla
5. handoff override (kurallara göre)

---

# 🌐 TEST ENDPOINT

POST `/sales/decision/test`

Input:
- conversationId
- messageId

Output:
- FinalSalesDecision

---

# 🧪 TESTLER

## Unit
- intent mapping
- lead stage policy
- action recommender
- objection policy

## Integration
- AI decision → final decision dönüşümü
- edge case: unknown intent
- high objection → handoff önerisi

---

# ⚠️ ERROR HANDLING

- missing AI fields → default fallback
- unknown intent → "unknown"
- invalid stage → "new"

---

# 🪵 LOGGING

- raw AI decision (sanitize)
- mapped intent
- final action

---

# 🚫 BU FAZDA YAPILMAYACAKLAR

- WhatsApp’a otomatik reply
- DB’ye kalıcı state değişimi (opsiyonel flag hariç)
- analytics yazımı

---

# ✅ DEFINITION OF DONE

- AI decision → FinalSalesDecision dönüşüyor
- intent/lead/action düzgün çalışıyor
- test endpoint ile doğrulanabiliyor

---

# 📌 CODEX NOTU

> Bu faz, AI kararını **satış mantığına bağlayan katmandır**.

Faz 7’de bu karar gerçek aksiyonlara (reply/handoff) bağlanacaktır.

