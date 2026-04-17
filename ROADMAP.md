# WhatsApp Sales Engine — Düzeltme Roadmap

Bu doküman, fazlara bölünmüş düzeltme planını ve her faz tamamlandığında ne yapıldığını izler. Her sprint biter bitmez "Durum" bölümüne özet eklenir.

## Önerilen uygulama sırası

1. Sprint 1 — Backend security (workspace isolation) ✅
2. Sprint 2 — Client auth ✅
3. Sprint 3 — Client API layer ✅
4. Sprint 4 — AI setup entegrasyonu ✅
5. Sprint 5 — Live chat entegrasyonu ✅
6. Sprint 6 — Dashboard/analytics/leads ✅
7. Sprint 7 — Connection ekranı ✅
8. Sprint 8 — Notifications ✅
9. Sprint 9 — Queue ✅
10. Sprint 10 — Instagram ingestion ✅
11. Sprint 11 — Test stabilization ✅
12. Sprint 12 — Final UX + production prep ✅

---

## Sprint 1 — Kritik backend güvenlik ve veri izolasyonu ✅ TAMAMLANDI

### Hedef
- Workspace isolation açıklarını kapatmak
- Conversation bazlı endpoint'leri güvenli hale getirmek
- Authenticated kullanıcı yalnızca kendi workspace'ine ait veriyi görebilir/değiştirebilir

### Kapsam
- `GET /conversations/:id`
- `POST /conversations/:id/send`
- `PATCH /conversations/:id/ai-mode`
- `POST /conversations/:id/handoff`
- `POST /conversations/:id/handoff/end`
- `POST /handoff/sessions`
- `PATCH /handoff/sessions/:sessionId/end`

### Yapılanlar
1. **Merkezi guard servisi eklendi**
   - `server/src/common/services/workspace-access.service.ts` → `assertConversationInWorkspace`, `assertHandoffSessionInWorkspace`
   - `NotFoundException` (kaynak yok) ve `ForbiddenException` (workspace mismatch) ayrımı
   - `server/src/common/common.module.ts` → `@Global()` modül, AppModule'e bağlandı

2. **Controller seviyesi ownership**
   - `ConversationsController.detail` → `CurrentUser` + `workspaceId` filtresiyle `findFirst`
   - `ExecutionController` → tüm 4 endpoint artık `user.workspaceId`'yi servise aktarıyor
   - `HandoffController` → start/end endpoint'leri `user.workspaceId`'yi servise aktarıyor

3. **Service seviyesi defense-in-depth**
   - `ConversationsService.getConversationDetail(id, workspaceId?)` → workspace filtresiyle sorgu
   - `AiModeService.setMode(id, mode, workspaceId?)` → update öncesi ownership assert
   - `ReplyExecutorService.manualSend(id, text, workspaceId?)` → send öncesi ownership assert
   - `HandoffExecutorService.startHandoff/endHandoff` → conversation workspaceId inline check
   - `HandoffService.startSession/endSession` → conversation ve session ownership check
   - `ExecutionService.manualSend / startManualHandoff / endManualHandoff` → workspaceId'yi alt servislere forward ediyor

4. **Testler**
   - `workspace-access.service.spec.ts` (yeni) — 6 senaryo: conversation & handoff-session için NotFound / Forbidden / success
   - `ai-mode.service.spec.ts` — cross-workspace reject senaryosu eklendi
   - `handoff-executor.service.spec.ts` — startHandoff ve endHandoff için Forbidden senaryoları
   - `reply-executor.service.spec.ts` — manualSend Forbidden senaryosu + tüm mevcut testler yeni constructor imzasına güncellendi
   - `ai-mode.service.spec.ts` / `reply-executor.service.spec.ts` / `handoff-executor.service.spec.ts` — WorkspaceAccessService mock'u eklendi

### Done kriterleri (karşılanıyor)
- ✅ Başka workspace'e ait conversation id verilince erişim reddediliyor (`ForbiddenException`)
- ✅ Auth guard + ownership guard birlikte çalışıyor (JWT → role → workspace)
- ✅ Service seviyesinde de kontrol var → controller bypass edilse bile koruma devam ediyor

### Doğrulama
- `tsc --noEmit -p tsconfig.build.json` → hata yok
- `jest --config ./test/jest-unit.json` → 29 suite / 75 test passing

### Değişen dosyalar
- Yeni: `server/src/common/common.module.ts`, `server/src/common/services/workspace-access.service.ts`, `server/src/common/services/workspace-access.service.spec.ts`
- Güncellendi: `server/src/app.module.ts`, `server/src/conversations/conversations.controller.ts`, `server/src/conversations/conversations.service.ts`, `server/src/execution/execution.controller.ts`, `server/src/execution/services/execution.service.ts`, `server/src/execution/services/ai-mode.service.ts`, `server/src/execution/services/reply-executor.service.ts`, `server/src/execution/services/handoff-executor.service.ts`, `server/src/handoff/handoff.controller.ts`, `server/src/handoff/handoff.service.ts`, ilgili `*.spec.ts` dosyaları

### Notlar / Takip
- `workspaceId` parametresi opsiyonel bırakıldı: webhook / queue gibi sistem-trusted internal akışlar `executeForInboundMessage` üzerinden çalıştığı için onları etkilemiyor. HTTP surface üzerinden gelen tüm çağrılarda controller `user.workspaceId`'yi her zaman dolduruyor.
- E2E testleri DB gerektirdiği için lokal çalıştırılmadı; CI'da yeniden doğrulanmalı.

---

## Sprint 2 — Client auth ve gerçek session akışı ✅ TAMAMLANDI

### Hedef
- Login sayfasını gerçek auth'a bağlamak
- Token yönetimini kurmak
- User/workspace context'i local fallback'ten çıkarmak

### Yapılanlar
1. **Token storage utility**
   - `client/src/app/lib/auth/tokenStorage.ts` → `read / write / clear` üzerinden localStorage soyutlaması (SSR / private browsing fallback safe)

2. **Merkezi API client**
   - `client/src/app/lib/api/apiClient.ts` → `apiRequest<T>()`
     - Bearer token header otomatik ekleniyor
     - 401 alınırsa `POST /auth/refresh` → başarılı ise orijinal istek yeni token ile tekrarlanıyor (single-flight)
     - Refresh başarısız olursa `onUnauthorized()` çağrılıp session temizleniyor
     - `ApiError` class (status + message + body) ile tekil hata tipi
   - `VITE_API_BASE_URL` environment değişkenine duyarlı

3. **AuthProvider + useAuth**
   - `client/src/app/lib/auth/AuthContext.tsx` → `status: 'loading' | 'authenticated' | 'unauthenticated'`, `user`, `workspace`, `login()`, `logout()`, `refreshSession()`
   - Mount edildiğinde token varsa `GET /auth/me` ile session restore
   - `setUnauthorizedHandler` apiClient'tan tetiklenince otomatik logout

4. **ProtectedRoute**
   - `client/src/app/components/ProtectedRoute.tsx` → `loading` için spinner, `unauthenticated` ise `/login` yönlendirmesi (`from` state'i ile geri dönüş adresini koruyor)

5. **Login sayfası gerçek API'ye bağlı**
   - `Login.tsx` artık `useAuth().login()` çağırıyor, 401 ve network hatası için kullanıcıya mesaj gösteriyor
   - Zaten authenticated isse direkt `from` hedefine yönlendiriyor

6. **Routes korumaya alındı**
   - `/`, `/ai-setup`, `/ai-ready` ve Layout altındaki tüm rotalar `ProtectedRoute` ile sarıldı (`routes.tsx`)

7. **Layout**
   - Demo `demo@prompta.ai` sabit email ve "Premium Plan" yazısı kaldırıldı → `useAuth().user.displayName/email` + `workspace.name`
   - Logout butonu `useAuth().logout()` + `/login`'e yönlendirme

### Done kriterleri (karşılanıyor)
- ✅ Kullanıcı gerçek backend `/auth/login` üzerinden login olabiliyor
- ✅ Access token tüm `apiRequest` çağrılarında otomatik ekleniyor
- ✅ 401 alınınca refresh denemesi yapılıyor ve başarılıysa istek tekrarlanıyor
- ✅ Sayfa yenilemesinden sonra `/auth/me` ile session restore oluyor
- ✅ Client'ta hardcoded workspace/user fallback kalmadı (Layout içinde)

### Doğrulama
- `vite build` → başarılı, 2270 modül, hata yok

### Değişen / yeni dosyalar
- Yeni: `client/src/app/lib/auth/tokenStorage.ts`, `client/src/app/lib/auth/AuthContext.tsx`, `client/src/app/lib/api/apiClient.ts`, `client/src/app/components/ProtectedRoute.tsx`
- Güncellendi: `client/src/app/App.tsx`, `client/src/app/routes.tsx`, `client/src/app/pages/Login.tsx`, `client/src/app/components/Layout.tsx`

### Notlar / Sprint 3'e taşınan
- `useNotifications` hook'u hâlâ direkt `fetch` kullanıyor ve auth header eklemiyor → Sprint 3'te `apiClient`'a göçecek
- SSE stream (`/notifications/stream`) auth problemi Sprint 8 kapsamında
- Diğer sayfa-içi veri fetch noktaları Sprint 3'te merkezi `apiClient`'a taşınacak

---

## Sprint 3 — Client API layer ve global data fetching düzeni

### Hedef
- Ekranlar aynı veri erişim mantığını kullansın
- Mock state'ler temizlensin

### Kapsam
- Ortak API client + auth header otomatik ekleme
- Reusable hook / service layer
- Ortak loading / error / empty state pattern'i
- Alanlar: conversations, brand context, training settings, analytics, notifications, WhatsApp connection, AI test/decision

### Durum
✅ TAMAMLANDI

- `client/src/app/lib/api/services.ts` ile tipli ortak API servis katmanı eklendi.
- `client/src/app/lib/api/useApiQuery.ts` ile ortak loading/error/refetch pattern'i standartlaştırıldı.
- Sayfa bazlı dağınık fetch/mock state kullanımı yerine merkezi servis/hook yapısı devreye alındı.

---

## Sprint 4 — AI Setup ekranını backend'e bağla

### Hedef
- Website analizi, Instagram analizi, training settings, resolved brand context → hepsi gerçek API

### Durum
✅ TAMAMLANDI

- `AISetup` sayfası `POST /brand-context/website/analyze`, `POST /brand-context/instagram/analyze`, `POST /brand-context`, `PATCH /training-settings` endpoint'lerine bağlandı.
- `AIReady` ekranı artık backend'den gelen `sourceStatus`, `resolvedContext`, `trainingSettings` verisiyle çalışıyor.

---

## Sprint 5 — Live Chat ekranını gerçek conversation engine'e bağla

### Hedef
- Conversation list, thread, manual send, AI mode, handoff → gerçek API'lere bağlı

### Durum
✅ TAMAMLANDI

- `LiveChat` sayfası `GET /conversations`, `GET /conversations/:id`, `POST /conversations/:id/send`, `PATCH /conversations/:id/ai-mode`, `POST /conversations/:id/handoff`, `POST /conversations/:id/handoff/end` endpoint'lerine bağlandı.
- Chat thread ve aksiyon butonları artık gerçek conversation/message verisini kullanıyor.

---

## Sprint 6 — Dashboard, Analytics ve Lead Management

### Hedef
- Overview / funnel / AI analytics + lead query + filtreler

### Durum
✅ TAMAMLANDI

- `Dashboard`, `Analytics`, `LeadManagement` ekranları gerçek analytics/conversation endpoint'lerinden besleniyor.
- Funnel, AI performance, conversation metrikleri mock veri yerine backend response ile gösteriliyor.

---

## Sprint 7 — WhatsApp Connection ekranı

### Hedef
- Active connection görüntüleme, reconnect / remove / test, health state

### Durum
✅ TAMAMLANDI

- Yeni backend endpoint'ler eklendi: `GET /whatsapp/connection`, `POST /whatsapp/connection/test`, `POST /whatsapp/connection/reconnect`, `DELETE /whatsapp/connection`.
- `Connection` ekranı aktif durum, health mesajı, test/reconnect/remove aksiyonlarıyla gerçek API'ye bağlandı.

---

## Sprint 8 — Notification sistemi

### Hedef
- Real notifications, unread/read state, SSE auth, polling fallback

### Durum
✅ TAMAMLANDI

- Notifications hook'u merkezi API servis katmanına taşındı.
- `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` endpoint akışları aktif.
- Realtime için auth header ile stream okuma ve polling fallback birlikte çalışacak şekilde düzenlendi.

---

## Sprint 9 — Gerçek queue altyapısı

### Hedef
- Memory queue → BullMQ + Redis, retry / backoff / DLQ, worker ayrımı

### Durum
✅ TAMAMLANDI

- Queue altyapısı `inbound-execution`, `ai-decision`, `outbound-message` için BullMQ uyumlu hale getirildi.
- `QUEUE_DRIVER=memory|bullmq` ile sürücü seçimi eklendi; memory fallback korundu.
- Retry/backoff politikası tüm queue’larda `EXECUTION_QUEUE_*` ayarlarıyla standartlaştırıldı.
- Hata kayıtları için `queue_failure_logs` tablosu + `QueueFailureLogService` eklendi.
- Worker ayrımı için `APP_ROLE=worker` bootstrap modu ve `npm run start:worker` komutu eklendi.
- Production validation sıkılaştırıldı: `QUEUE_DRIVER=bullmq` + `REDIS_URL` zorunlu.

---

## Sprint 10 — Instagram source ingestion

### Hedef
- Bağımsız Instagram source ingestion, gerçek profile/caption çekme, snapshot

### Durum
✅ TAMAMLANDI

- `InstagramDataFetcherService`, WhatsApp metadata hack’inden tamamen çıkarıldı.
- Resmi Graph API üzerinden profil + media caption verisi çekilecek akış eklendi.
- `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `INSTAGRAM_GRAPH_API_VERSION`, `INSTAGRAM_MEDIA_LIMIT`, `INSTAGRAM_PROVIDER_TIMEOUT_MS` konfigürasyonu aktive edildi.
- Eksik credential durumunda kontrollü warning + fallback davranışı korunarak analiz akışı kırılmadan devam edecek şekilde düzenlendi.
- Yeni unit testler eklendi: credential yok, başarılı fetch, API error senaryoları.

---

## Sprint 11 — Test stabilization

### Hedef
- Unit / integration / e2e / smoke gerçekten koşsun, provider mock'ları stabil

### Durum
✅ TAMAMLANDI

- Test env helper’ları yeni queue/instagram env parametreleriyle güncellendi.
- Queue servis refactor’u sonrası integration/smoke testleri yeni `getStats`/DI yapısına göre güncellendi.
- Doğrulama:
  - `npm run test:unit` ✅
  - `npm run test:integration` ✅
  - `npm run test:e2e` ✅
  - `npm run test:smoke` ✅
  - `npm run test:all` ✅

---

## Sprint 12 — Final UX + production checklist

### Hedef
- Mock kalıntıları temizle, loading/error/empty polish, email test, env validation, health/version

### Durum
✅ TAMAMLANDI

- Client tarafında page-help akışı (one-time + manuel tekrar açma) ve gerçek notification lifecycle zaten aktif hale getirilen yapıyla finalize edildi.
- Dashboard üzerindeki fake/misleading “demo” microcopy temizlendi.
- `.env.example` production hazırlığı için queue/worker/instagram değişkenleriyle güncellendi.
- Env validation production kuralları queue ve Instagram ingestion için sıkılaştırıldı.
- `GET /health` ve `GET /version` uçları smoke kapsamında doğrulandı.
- Son doğrulama:
  - `server`: `npm run lint`, `npm run build`, `npm run test:all` ✅
  - `client`: `npm run build` ✅
