# WhatsApp Sales Engine — Phase 8 Spec

## 🎯 Faz 8 Amacı

> Sistemin ürettiği tüm aksiyonları ölçmek, satış performansını analiz etmek ve işletmeye **gerçek içgörüler (insights)** sunan Analytics katmanını kurmak.

Bu faz sonunda sistem:
- tüm kritik event’leri kaydeder
- conversion funnel oluşturur
- AI performansını ölçer
- satış sürecindeki drop-off noktalarını tespit eder
- dashboard için hazır veri sağlar

Bu fazda henüz:
- production scaling
- rate limit advanced tuning
- multi-tenant optimization

yapılmayacaktır.

---

# 🧱 KAPSAM

- analytics_events genişletme
- event tracking sistemi
- metrics calculation servisleri
- reporting endpoint’leri
- AI performans ölçümü
- funnel analizi

---

# 🧠 ANA PRENSİP

> Ölçemediğin şeyi optimize edemezsin.

Bu faz:
- AI’ın gerçekten satış yapıp yapmadığını gösterir
- ajans olarak müşteriye değer sunmanı sağlar

---

# 🗄️ 1. VERİ MODELİ

## analytics_events (güncellenecek)

Alanlar:
- id
- workspaceId
- conversationId (nullable)
- type (string)
- payloadJson
- createdAt

---

## Event Tipleri

- message_received
- message_sent
- ai_decision_created
- reply_sent
- reply_skipped
- handoff_started
- handoff_ended
- lead_stage_changed
- conversation_closed

---

# 🧩 2. EVENT TRACKING

## analytics.service.ts

Fonksiyon:
```ts
track(eventType: string, payload: object)
```

Kullanım:
- webhook sonrası
- AI decision sonrası
- reply sonrası
- handoff sonrası

---

# 📊 3. METRICS

## Hesaplanacak metrikler

- total messages
- total conversations
- AI response rate
- human takeover rate
- avg response time
- conversion rate (leadStage → hot)

---

# 🔄 4. FUNNEL ANALİZİ

## Funnel

- new → qualified → hot → closed

## Hesaplama

- her aşamadaki drop-off
- conversion yüzdeleri

---

# 🤖 5. AI PERFORMANCE

## Ölçümler

- AI reply success rate
- handoff frequency
- AI confidence average

---

# 🌐 6. ENDPOINT’LER

## 6.1 Genel metrikler
GET `/analytics/overview`

## 6.2 Funnel
GET `/analytics/funnel`

## 6.3 Conversation metrics
GET `/analytics/conversations`

## 6.4 AI performance
GET `/analytics/ai`

---

# 🧪 7. TESTLER

- event tracking doğru mu
- metrics doğru hesaplanıyor mu
- edge case (boş data)

---

# ⚠️ ERROR HANDLING

- eksik veri → default 0
- divide by zero → guard

---

# 🪵 LOGGING

- analytics hesaplama hataları

---

# 🚫 BU FAZDA YAPILMAYACAKLAR

- real-time streaming dashboard
- BI entegrasyonları

---

# ✅ DEFINITION OF DONE

- event tracking çalışıyor
- metrics endpoint’leri veri dönüyor
- funnel hesaplanıyor

---

# 📌 CODEX NOTU

> Bu faz, ürünü “araç”tan “raporlanabilir sistem”e çevirir.

Müşteriye değer burada görünür olur.
