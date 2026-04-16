# WhatsApp Sales Engine — Phase 9 Spec

## 🎯 Faz 9 Amacı

> Sistemi production-ready hale getirmek, çoklu müşteri (multi-tenant) desteği eklemek, client (UI) entegrasyonunu tamamlamak ve operasyonel dayanıklılığı (hardening) sağlamak.

Bu faz sonunda sistem:
- güvenli kimlik doğrulama (auth) ile çalışır
- workspace (tenant) bazlı izole veri modeli sunar
- UI ile tam entegre olur
- queue + retry + rate-limit ile stabil çalışır
- hatalara dayanıklı ve izlenebilir olur

---

# 🧱 KAPSAM

- Auth & Authorization
- Multi-tenant (workspace) modeli
- Client (UI) entegrasyonu
- Queue & job processing
- Retry & rate limiting
- Config hardening
- Observability (logs/metrics/traces)
- Deployment & env ayrımı

---

# 🧠 ANA PRENSİP

> "Çalışıyor" yetmez → **"sürekli, güvenli ve ölçeklenebilir çalışıyor"** olmalı.

---

# 🔐 1. AUTH & AUTHORIZATION

## Seçenekler
- JWT (stateless) + refresh token
- veya Supabase Auth entegrasyonu

## Gereksinimler
- kullanıcı (user) → workspace ilişkisi
- role-based access (admin, agent, viewer)

## Endpointler
- POST /auth/login
- POST /auth/refresh
- GET /auth/me

## Kurallar
- tüm yazma endpoint’leri auth gerektirir
- workspaceId token’dan türetilir (client’tan kör alınmaz)

---

# 🏢 2. MULTI-TENANT (WORKSPACE)

## Model
- users
- workspaces
- workspace_members (role)

## Kurallar
- her tabloya workspaceId zorunlu
- tüm sorgular workspaceId ile filtrelenir
- cross-tenant veri erişimi mümkün olmamalı

---

# 🔌 3. CLIENT (UI) ENTEGRASYONU

## API Kontratları
- conversations list/detail (Faz 3)
- ai decision test (Faz 5)
- sales decision (Faz 6)
- execution (Faz 7)
- analytics (Faz 8)
- brand context & training (Faz 4)

## Ek Endpointler
- GET /health
- GET /version

## Realtime (opsiyonel)
- WebSocket veya SSE ile new message push

---

# 🧵 4. QUEUE & JOB PROCESSING

## Amaç
Webhook → AI → Execution akışını asenkron ve güvenli çalıştırmak

## Araç
- BullMQ / Redis

## Kuyruklar
- inbound-events
- ai-decisions
- outbound-messages
- analytics-events

## Kurallar
- idempotent job tasarımı
- retry/backoff stratejisi

---

# 🔁 5. RETRY & RATE LIMIT

## Retry
- WhatsApp send fail → exponential backoff
- AI provider fail → limited retry + fallback provider

## Rate Limit
- inbound webhook flood koruması
- outbound message throttling (per number / per workspace)

---

# ⚙️ 6. CONFIG HARDENING

## Ortamlar
- development
- staging
- production

## Env Yönetimi
- zorunlu alanlar validate edilir
- secretlar güvenli saklanır (vault/secret manager opsiyonel)

---

# 🔍 7. OBSERVABILITY

## Logging
- structured logs (JSON)
- correlationId / requestId

## Metrics
- request latency
- queue length
- error rate

## Tracing (opsiyonel)
- OpenTelemetry

---

# 🛡️ 8. GÜVENLİK

- HTTPS zorunlu
- webhook endpoint IP allowlist (opsiyonel)
- payload size limit
- input validation (DTO + class-validator)
- secrets asla loglanmaz

---

# 🚀 9. DEPLOYMENT

## Öneri
- Dockerize (backend + worker)
- ayrı process: API ve queue worker

## Sağlayıcı
- Vercel/Render/Fly.io (API)
- Redis (Upstash/Elasticache)
- Postgres (Supabase)

---

# 🧪 10. TEST & SMOKE

## Smoke checklist
- auth çalışıyor
- workspace isolation doğru
- webhook → queue → DB → AI → reply akışı çalışıyor
- analytics endpoint veri dönüyor

---

# ⚠️ 11. ERROR HANDLING

- global exception filter
- user-friendly error + internal log
- circuit breaker (opsiyonel) AI provider için

---

# 🚫 12. BU FAZDA YAPILMAYACAKLAR

- ileri seviye BI
- ML model eğitimi
- multi-region replication

---

# ✅ 13. DEFINITION OF DONE

- auth + workspace sistemi çalışıyor
- UI tüm endpoint’lere bağlanıyor
- queue ile asenkron akış stabil
- retry/rate-limit aktif
- production env’de deploy edilebilir

---

# 📌 CODEX NOTU

> Bu faz, sistemi **ürün** haline getirir.

Artık sistem:
- çoklu müşteri destekler
- güvenlidir
- ölçeklenebilir
- canlıya alınabilir

Bu noktadan sonra ürün pazara çıkmaya hazırdır.