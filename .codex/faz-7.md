# WhatsApp Sales Engine — Phase 7 Spec

## 🎯 Faz 7 Amacı

> Sales Engine (Faz 6) tarafından üretilen **FinalSalesDecision**’ı canlı aksiyonlara bağlamak: WhatsApp’a otomatik/yarı otomatik cevap gönderimi ve insan temsilciye (handoff) devri.

Bu faz sonunda sistem:
- AI kararına göre **outbound mesaj** gönderebilir
- **AI auto-reply / suggest-only** modlarını destekler
- **human takeover (handoff)** başlatabilir ve yönetir
- konuşma bazında **AI pause / resume** yapabilir
- aksiyonları güvenli ve izlenebilir şekilde uygular

---

# 🧱 KAPSAM

- execution/orchestration katmanı
- auto-reply policy (gönder / gönderme)
- handoff yönetimi (başlat / bitir)
- AI pause/resume
- outbound WhatsApp entegrasyonu ile bağlama
- operasyonel endpoint’ler

---

# 🧩 MODÜLLER

## execution module (yeni)

Dosyalar:
- execution.module.ts
- services/
  - execution.service.ts
  - reply-executor.service.ts
  - handoff-executor.service.ts
  - ai-mode.service.ts

## mevcut modüllerle entegrasyon
- whatsapp module (Faz 2)
- conversations module (Faz 3)
- ai-brain (Faz 5)
- sales-engine (Faz 6)

---

# 🧠 ANA PRENSİP

> Karar (decision) ile aksiyon (execution) ayrıdır.

Execution katmanı:
- policy’leri uygular
- güvenli gönderim yapar
- insan devrini yönetir

---

# ⚙️ 1. AI MODES (ÇOK KRİTİK)

Konuşma bazlı AI çalışma modu:

## AiMode
- auto_reply      → AI kararına göre otomatik mesaj gönderir
- suggest_only    → AI sadece önerir, mesaj göndermez
- paused          → AI devre dışı (insan aktif)

Tablo (conversations) ek alan:
- aiMode (default: auto_reply)

Servis:
`ai-mode.service.ts`
- setMode(conversationId, mode)
- getMode(conversationId)

---

# 📤 2. REPLY EXECUTION

## reply-executor.service.ts

Girdi:
- FinalSalesDecision
- conversationId

Akış:
1. aiMode kontrol et
2. shouldSendReply kontrol et
3. eğer auto_reply ise:
   - suggestedReply al
   - WhatsApp provider ile gönder
   - outbound message olarak kaydet
4. değilse sadece logla

Kurallar:
- boş mesaj gönderilmez
- aynı mesaj spam olmamalı (rate-limit/simple debounce)
- hata durumunda retry sınırlı olmalı

---

# 🤝 3. HANDOFF EXECUTION

## handoff-executor.service.ts

Amaç:
AI → Human devrini yönetmek

Akış:
1. FinalSalesDecision.shouldHandoff kontrol et
2. true ise:
   - conversation.aiMode = paused
   - handoff_sessions kaydı oluştur
   - temsilciye bildirim (event/log)

## Handoff bitirme
- temsilci işlemi bitirir
- aiMode tekrar auto_reply veya suggest_only yapılır
- handoff session kapanır

---

# 🔁 4. ORCHESTRATION FLOW

## execution.service.ts

Akış:
1. Faz 3: inbound message geldi
2. Faz 5: AI decision üretildi
3. Faz 6: FinalSalesDecision oluşturuldu
4. Faz 7:
   - handoff kontrol et
   - reply execution kontrol et

Pseudo:
```ts
if (decision.shouldHandoff) {
  handoffExecutor.start(...)
}

if (decision.shouldSendReply) {
  replyExecutor.send(...)
}
```

---

# 📨 5. WHATSAPP ENTEGRASYON BAĞLANTISI

reply-executor, Faz 2’deki:
- whatsapp-message-sender.service
veya
- meta-whatsapp.provider

üzerinden mesaj gönderir.

Kurallar:
- provider abstraction korunmalı
- execution layer doğrudan HTTP çağrısı yapmamalı

---

# 🧾 6. OUTBOUND MESSAGE PERSISTENCE

Faz 3 messages tablosu kullanılacak.

Outbound mesaj alanları:
- senderType = ai
- direction = outbound
- content = suggestedReply
- status = sent

---

# 🌐 7. ENDPOINT’LER

## 7.1 Manual send (override)
POST `/conversations/:id/send`

Body:
{
  "text": "..."
}

Amaç:
Temsilci manuel mesaj gönderebilir.

---

## 7.2 AI mode change
PATCH `/conversations/:id/ai-mode`

Body:
{
  "mode": "auto_reply" | "suggest_only" | "paused"
}

---

## 7.3 Handoff start (manual)
POST `/conversations/:id/handoff`

---

## 7.4 Handoff end
POST `/conversations/:id/handoff/end`

---

# 🧪 8. TESTLER

## Unit
- ai mode switching
- reply executor logic
- handoff trigger

## Integration
- inbound message → decision → reply gönderimi
- shouldHandoff true → aiMode paused
- paused modda reply gönderilmemesi
- manual send endpoint

---

# ⚠️ 9. ERROR HANDLING

Durumlar:
- WhatsApp send fail
- invalid decision
- aiMode mismatch

Kurallar:
- retry sınırlı
- fail loglanır
- conversation bozulmaz

---

# 🪵 10. LOGGING

- decision received
- reply sent / skipped
- handoff started / ended
- ai mode change

---

# 🚫 11. BU FAZDA YAPILMAYACAKLAR

- gelişmiş analytics
- template/media message
- otomatik leadStage DB update (opsiyonel olabilir)

---

# ✅ 12. DEFINITION OF DONE

- FinalSalesDecision → gerçek aksiyona dönüşüyor
- WhatsApp’a mesaj gönderiliyor
- handoff çalışıyor
- aiMode doğru yönetiliyor
- manuel kontrol endpoint’leri çalışıyor

---

# 📌 CODEX NOTU

> Bu faz, sistemi **gerçek canlı satış ajanına çevirir**.

Artık sistem:
- mesaj alır
- düşünür
- karar verir
- cevap verir veya insan devreder

Sonraki faz: Analytics & Production Hardening (Faz 8)