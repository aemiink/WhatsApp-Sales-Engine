# Yapilacaklar (Sprint 1-12 Sonrasi)

## 1. Veritabani migration
- [ ] Gelistirme ortami: `cd server && npm run prisma:migrate:dev`
- [ ] Production ortami: `cd server && npm run prisma:migrate:deploy`
- [ ] Prisma client guncelleme: `cd server && npm run prisma:generate`

## 2. Environment ve secret ayarlari
- [ ] `server/.env` degerlerini production icin tamamla.
- [ ] Queue ayarlari: `QUEUE_DRIVER=bullmq`, `REDIS_URL`, `QUEUE_PREFIX`, `QUEUE_INLINE_WORKERS`.
- [ ] Instagram ayarlari: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `INSTAGRAM_GRAPH_API_VERSION`.
- [ ] Mail ayarlari: `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `APP_BASE_URL`.
- [ ] Guvenlik ayarlari: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED=true`.

## 3. Runtime process ayrimi
- [ ] API process'i ayaga kaldir: `cd server && APP_ROLE=api npm run start:prod`
- [ ] Worker process'i ayaga kaldir: `cd server && APP_ROLE=worker npm run start:worker`
- [ ] Production icin ayrik calisma tercih et: `QUEUE_INLINE_WORKERS=false`

## 4. Canli oncesi dogrulama
- [ ] `GET /health` endpointi 200 donuyor.
- [ ] `GET /version` dogru versiyonu donuyor.
- [ ] Login + protected endpoint akisi dogrulandi.
- [ ] Inbound message -> queue -> AI karar -> outbound reply akisi dogrulandi.
- [ ] Notification paneli unread/read-all akislari dogrulandi.

## 5. Son kalite kapisi
- [ ] Server lint: `cd server && npm run lint`
- [ ] Server build: `cd server && npm run build`
- [ ] Server testler: `cd server && npm run test:all`
- [ ] Client build: `cd client && npm run build`

## 6. Release hazirligi
- [ ] `APP_VERSION` degerini release versiyonu ile guncelle.
- [ ] Son smoke kontrolunden sonra deploy al.
