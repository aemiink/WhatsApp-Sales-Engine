# WhatsApp Sales Engine — Phase 10 Spec

## 🎯 Faz 10 Amacı

> Faz 1–9 boyunca geliştirilen tüm backend bileşenlerini **tek tek ve uçtan uca test edecek**, tekrarlanabilir, otomasyon dostu bir test ve doğrulama yapısı kurmak.

Bu fazın amacı yeni ürün özelliği eklemek değildir.
Bu fazın amacı:
- tüm scriptleri ve servisleri doğrulamak
- entegrasyonları güvence altına almak
- regression riskini azaltmak
- CI/CD için test temeli hazırlamak
- production öncesi güvenilirlik sağlamaktır

---

# 🧱 KAPSAM

Bu fazda kurulacak yapı şunları kapsar:

- unit test yapısı
- integration test yapısı
- provider mock/fake yapıları
- end-to-end test senaryoları
- smoke test scriptleri
- seed/test fixture sistemi
- local test orchestration
- CI çalıştırma düzeni
- test coverage hedefleri
- test raporlama ve hata sınıflandırma

---

# 🧠 ANA PRENSİP

> "Kod yazıldı" yeterli değildir.
> "Her kritik akış tekrar tekrar doğrulanabiliyor" olmalıdır.

Bu fazın sonunda sistem şu seviyeye gelmelidir:
- geliştirici tek komutla testleri çalıştırabilmeli
- hangi katmanda hata olduğu hızlı anlaşılmalı
- WhatsApp / AI / DB / Queue / Auth akışları ayrı ayrı doğrulanabilmeli
- canlıya çıkmadan önce smoke test yapılabilmeli

---

# 🧩 TEST KATMANLARI

## 1. Unit Tests
Amaç:
- saf business logic doğrulamak
- küçük servisleri hızlı test etmek

Kapsam:
- intent mapper
- lead stage policy
- action recommender
- objection policy
- brand context resolver
- website signal extractor
- instagram signal extractor
- AI decision validator
- dedup key üretimi
- ai mode switching

---

## 2. Integration Tests
Amaç:
- modüllerin birbirine doğru bağlanıp bağlanmadığını test etmek

Kapsam:
- webhook → parser → conversation persistence
- brand context resolve flow
- AI decision generation flow
- sales decision flow
- execution flow
- analytics event tracking
- auth/workspace isolation

---

## 3. End-to-End (E2E) Tests
Amaç:
- ürünün gerçek kullanıcı akışlarını baştan sona doğrulamak

Kapsam:
- inbound WhatsApp message → DB → AI → FinalSalesDecision
- handoff başlatma / bitirme
- auto_reply / suggest_only / paused mod akışları
- report/export akışları
- UI destekleyen kritik backend kontratları

---

## 4. Smoke Tests
Amaç:
- deploy sonrası hızlı sağlık kontrolü

Kapsam:
- health endpoint
- auth
- DB erişimi
- webhook verify
- AI provider config
- queue çalışıyor mu
- analytics basic response

---

# 🗂️ KLASÖR VE DOSYA YAPISI

Önerilen test yapısı:

```text
server/
  test/
    unit/
      brand-context/
      sales-engine/
      ai-brain/
      whatsapp/
    integration/
      whatsapp/
      conversations/
      ai/
      execution/
      analytics/
    e2e/
      flows/
      auth/
      multi-tenant/
    fixtures/
      conversations/
      brand-context/
      ai/
      whatsapp/
    helpers/
      test-app.factory.ts
      prisma-test.factory.ts
      auth-test.helper.ts
      queue-test.helper.ts
      mock-whatsapp.provider.ts
      mock-ai.provider.ts
      seed.helper.ts
```

---

# ⚙️ TEST ALTYAPISI

## Test runner
- Jest veya mevcut NestJS test altyapısı

## E2E HTTP testleri
- Supertest

## DB stratejisi
- ayrı test database
- her test suite öncesi reset / seed
- transaction bazlı veya truncate bazlı temizleme

## Queue testleri
- gerçek Redis yerine mock/fake queue mümkünse tercih edilebilir
- ama en az bir integration senaryosu gerçek queue davranışını taklit etmelidir

---

# 🧪 UNIT TEST KAPSAMI

## brand-context
- website signal extraction
- instagram signal extraction
- resolved context merge
- confidence/source status hesaplama

## ai-brain
- context assembly
- prompt builder
- schema validation
- invalid AI output rejection
- provider selection

## sales-engine
- intent mapping
- lead stage policy
- objection normalization
- next-best-action

## whatsapp
- webhook verification
- payload parsing
- dedup key generation
- outbound payload builder

## execution
- ai mode logic
- reply executor conditions
- handoff executor logic

## analytics
- event-to-metric transformation
- funnel calculation
- divide-by-zero guard

---

# 🔗 INTEGRATION TEST KAPSAMI

## WhatsApp integration flow
- verify endpoint success/fail
- inbound webhook parse + persist
- duplicate webhook ignored
- status event updates message status

## Conversation flow
- yeni phone → yeni conversation
- aynı phone → mevcut conversation
- outbound message persistence

## Brand context flow
- website analyze → snapshot created
- instagram analyze → snapshot created
- training settings patch → context refreshed
- resolved context read

## AI decision flow
- conversation + message + brand context → structured decision
- invalid AI output → retry
- provider fallback / provider error

## Sales flow
- AI decision → FinalSalesDecision
- unknown intent fallback
- handoff-worthy decision normalize

## Execution flow
- auto_reply → outbound message sent
- paused → no send
- suggest_only → no send
- handoff starts session + pauses AI

## Analytics flow
- events tracked
- overview/funnel/ai metrics response valid

## Auth / multi-tenant
- workspace isolation
- another workspace data cannot be accessed
- protected endpoint unauthorized access blocked

---

# 🚀 E2E SENARYOLARI

Aşağıdaki senaryolar ayrı e2e test dosyaları olarak yazılmalıdır.

## Senaryo 1 — Basit otomatik satış cevabı
1. workspace + connection seed
2. brand context hazır
3. inbound mesaj gelir
4. AI decision üretilir
5. sales decision finalize olur
6. auto_reply ile mesaj gönderilir
7. outbound message DB’ye yazılır

## Senaryo 2 — Handoff akışı
1. objection içeren inbound message
2. AI handoff önerir
3. sales engine finalize eder
4. handoff session açılır
5. conversation aiMode paused olur

## Senaryo 3 — Suggest only modu
1. aiMode suggest_only
2. inbound mesaj gelir
3. decision üretilir
4. outbound mesaj gönderilmez
5. decision inspect edilebilir

## Senaryo 4 — Brand context eksik
1. conversation var
2. brand context eksik
3. AI decision isteği yapılır
4. typed error veya safe fallback üretilir

## Senaryo 5 — Analytics smoke
1. farklı eventler üretilir
2. metrics endpoint çağrılır
3. overview/funnel/ai response döner

---

# 🧰 FIXTURE / SEED STRATEJİSİ

Testler için tekrar kullanılabilir fixture yapısı kurulmalıdır.

## Fixture tipleri
- workspace fixture
- user fixture
- whatsapp connection fixture
- brand context fixture
- training settings fixture
- conversation fixture
- message fixture
- ai decision fixture

## Seed helper
Tek komutla belirli test senaryosunu ayağa kaldırabilmelidir.

Örnek helper:
- createTestWorkspace()
- createBrandContext()
- createConversationWithMessages()
- seedAutoReplyScenario()

---

# 🤖 MOCK / FAKE PROVIDERLAR

Harici servisler testlerde doğrudan gerçek API’ye gitmemelidir.

## Mock WhatsApp Provider
Desteklemeli:
- sendTextMessage
- verifyWebhook

## Mock AI Provider
Desteklemeli:
- deterministic valid output
- invalid output senaryosu
- timeout senaryosu
- fallback test senaryosu

## Mock Instagram / Website services
- parse edilmiş sabit response dönebilir

Kurallar:
- fake provider’lar production kodundan net ayrılmalı
- DI ile inject edilebilir olmalı

---

# 🏥 SMOKE TEST YAPISI

## Ayrı script oluştur
Önerilen script isimleri:
- `npm run test:smoke`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:all`

## Smoke test kontrol listesi
- app ayağa kalkıyor
- db bağlanıyor
- migrations/schema uyumlu
- auth çalışıyor
- whatsapp verify çalışıyor
- AI provider env valid
- analytics endpoint 200 dönüyor

---

# 📈 COVERAGE HEDEFLERİ

Sabit rakam zorunlu değil ama hedef belirlenmeli.

Öneri:
- business logic servisleri: yüksek coverage
- provider wrapper’lar: orta coverage
- controllers: düşük/temel coverage

İlk hedef:
- kritik service katmanlarında güçlü coverage

---

# 🔍 HATA SINIFLANDIRMA

Testlerde hata türleri net ayrılmalıdır:

- config/env errors
- provider errors
- validation errors
- db consistency errors
- auth/tenant isolation errors
- queue/execution errors

Bu ayrım test raporlarını anlamayı kolaylaştırır.

---

# 📦 CI / OTOMASYON

Bu fazda CI dostu yapı hazırlanmalıdır.

## Beklenti
- unit testler hızlı koşmalı
- integration ve e2e ayrılmalı
- test env ile local env ayrılmalı
- CI’da kullanılabilecek komutlar hazır olmalı

Opsiyonel ama önerilen:
- coverage raporu
- junit/json rapor export

---

# 🔐 TEST GÜVENLİĞİ

- gerçek production tokenları testte kullanılmamalı
- fake env kullanılmalı
- share/public link testleri isolated yapılmalı
- secrets loglanmamalı

---

# 🌐 HEALTH / DEBUG ENDPOINTLERİ

Test kolaylığı için gerekiyorsa internal-only endpointler düşünülebilir:
- `/health`
- `/health/db`
- `/debug/config` (sadece test/dev, prod’da kapalı)

Ama bu endpointler güvenlik kontrolüyle ve ortam bazlı olmalıdır.

---

# ⚠️ BU FAZDA YAPILMAYACAKLAR

- yeni ürün özelliği
- yeni UI ekranı
- yeni AI capability
- production deployment scriptlerinin tam otomasyonu

Bu faz sadece:

> **kalite güvencesi ve test altyapısı**

kuracaktır.

---

# ✅ DEFINITION OF DONE

Bu faz tamamlanmış sayılır eğer:

- unit/integration/e2e klasör yapısı kurulmuşsa
- kritik business akışlarının testleri yazılmışsa
- mock/fake provider yapıları hazırsa
- smoke test scriptleri çalışıyorsa
- CI’da koşturulabilecek net test komutları varsa
- geliştirici tek komutla ana test setlerini çalıştırabiliyorsa

---

# 📌 CODEX NOTU

Bu fazın amacı:

> **Faz 1–9’da yapılan tüm sistemi güvenilir şekilde doğrulanabilir hale getirmek**

Burada yeni ürün değil, kalite sistemi inşa edilecektir.

Başka bir deyişle:
- yazılmış her şeyin test edilebilir olması sağlanacak
- kritik akışlar tekrar tekrar güvenle çalıştırılabilecek
- production öncesi güven oluşturulacaktır.

