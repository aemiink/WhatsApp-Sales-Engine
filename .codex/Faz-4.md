# WhatsApp Sales Engine — Phase 4 Spec

## 🎯 Faz 4 Amacı

Bu fazın amacı:

> AI'ın müşteriye cevap vermeden önce markayı öğrenmesini sağlayacak **Brand Context Engine** altyapısını kurmaktır.

Bu faz sonunda sistem:
- workspace bazlı brand context kaydı tutabilecek
- website verisini parse edip normalize edebilecek
- Instagram verisini okuyup normalize edebilecek
- Brand DNA + manual training settings ile bunları birleştirebilecek
- AI'ın ileride kullanacağı tekil bir **resolved brand context** üretebilecek

Bu fazda henüz:
- AI cevap üretimi
- otomatik reply gönderimi
- sales intent kararları
- handoff logic

yapılmayacaktır.

---

# 🧱 KAPSAM

## Bu fazda yapılacaklar

- brand context veri modeli tamamlanacak
- website ingestion + parsing + signal extraction
- Instagram ingestion + signal extraction
- manual training settings ile context birleşimi
- resolved brand context üretimi
- read/update endpoint'leri
- cache / snapshot mantığı için temel hazırlık

---

# 🧠 ANA PRENSİP

Bu ürünün farkı şudur:

> AI önce markayı öğrenir, sonra müşteriyle konuşur.

Bu nedenle Brand Context Engine şu kaynakları birleştirmelidir:
- website
- Instagram
- Brand DNA
- ürün/hizmet bilgileri
- FAQ
- yasak cevaplar
- handoff kuralları

Ve bunlardan AI'a verilecek tek bir birleşik yapı üretmelidir.

---

# 🗄️ 1. VERİ MODELİ

Faz 1'deki tablolar genişletilecektir.

## 1.1 brand_contexts

Amaç:
Workspace için normalize edilmiş ana context kaydı.

Alanlar:
- id
- workspaceId (unique)
- sourceStatusJson
- websiteSignalsJson
- instagramSignalsJson
- resolvedContextJson
- confidenceJson
- lastResolvedAt
- createdAt
- updatedAt

Açıklama:
- `websiteSignalsJson` → website parse sonucu normalize sinyaller
- `instagramSignalsJson` → Instagram parse sonucu normalize sinyaller
- `resolvedContextJson` → AI için hazır birleşik context
- `sourceStatusJson` → hangi kaynağın güncel/eski/eksik olduğunu gösterir
- `confidenceJson` → website/instagram/manual confidence skorları

---

## 1.2 training_settings

Faz 1'deki tablo genişletilecek.

Alanlar:
- id
- workspaceId (unique)
- productsJson
- faqJson
- rulesJson
- forbiddenResponsesJson
- handoffRulesJson
- createdAt
- updatedAt

Açıklama:
- `productsJson` → ürün/hizmet bilgileri
- `faqJson` → sık sorulan sorular
- `rulesJson` → satış tonu, yazım kuralları, açıklama notları
- `forbiddenResponsesJson` → AI'ın asla söylememesi gereken şeyler
- `handoffRulesJson` → hangi durumlarda temsilciye devredileceği

---

## 1.3 website_analysis_snapshots

Yeni tablo.

Alanlar:
- id
- workspaceId
- rootUrl
- pagesJson
- extractedSignalsJson
- confidence
- createdAt

Amaç:
Website parse çıktısının snapshot olarak saklanması.

---

## 1.4 instagram_analysis_snapshots

Yeni tablo.

Alanlar:
- id
- workspaceId
- instagramHandle
- profileJson
- postsJson
- extractedSignalsJson
- confidence
- createdAt

Amaç:
Instagram parse çıktısının snapshot olarak saklanması.

---

# 🧩 2. MODÜLLER

## Oluşturulacak veya genişletilecek modüller

- brand-context module
- website-analysis module
- instagram-analysis module
- training-settings module

---

## 2.1 brand-context module

Sorumluluklar:
- brand context'i resolve etmek
- kaynaklardan gelen sinyalleri birleştirmek
- tekil resolved context üretmek
- read/update endpoint'leri sunmak

Önerilen servisler:
- brand-context.service.ts
- brand-context-resolver.service.ts
- brand-context-controller.ts

---

## 2.2 website-analysis module

Sorumluluklar:
- website fetch
- parse
- metadata extraction
- tone/CTA/product sinyalleri üretmek

Önerilen servisler:
- website-fetcher.service.ts
- website-parser.service.ts
- website-signal-extractor.service.ts

---

## 2.3 instagram-analysis module

Sorumluluklar:
- bağlı Instagram verisini almak
- bio/caption/post metadata sinyalleri çıkarmak
- tone/CTA/style sinyalleri üretmek

Önerilen servisler:
- instagram-data-fetcher.service.ts
- instagram-signal-extractor.service.ts

Not:
Bu fazda competitor Instagram analizi zorunlu değildir.
Workspace'in kendi bağlı Instagram hesabı yeterlidir.

---

## 2.4 training-settings module

Sorumluluklar:
- productsJson yönetimi
- faqJson yönetimi
- rulesJson yönetimi
- forbiddenResponsesJson yönetimi
- handoffRulesJson yönetimi

---

# 🌐 3. WEBSITE ANALYSIS

## Amaç
Workspace'in verdiği website URL'den brand sinyalleri çıkarmak.

## Kaynaklar
- ana sayfa
- hakkımızda
- ürün/kategori sayfaları
- footer/ortak CTA blokları

## Çıkarılacak sinyaller

```ts
interface WebsiteSignals {
  brandName: string | null;
  tagline: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  primaryKeywords: string[];
  ctaPatterns: string[];
  toneHints: string[];
  positioningHints: string[];
  premiumPerception: 'low' | 'medium' | 'high' | null;
  campaignAggressiveness: 'low' | 'medium' | 'high' | null;
  productFocusHints: string[];
}
```

## Kurallar
- AI kullanılmadan önce mümkün olduğunca heuristic extraction yapılmalı
- parse edilemeyen içerik null/boş bırakılmalı
- confidence hesaplanmalı

---

# 📸 4. INSTAGRAM ANALYSIS

## Amaç
Bağlı Instagram hesabından gerçek iletişim dili sinyalleri çıkarmak.

## Veri kaynakları
- bio
- username
- son 10–20 post caption
- hashtag'ler
- emoji yoğunluğu
- CTA pattern'ları

## Çıkarılacak sinyaller

```ts
interface InstagramSignals {
  username: string | null;
  bioSummary: string | null;
  toneHints: string[];
  ctaPatterns: string[];
  hashtagPatterns: string[];
  contentStyleHints: string[];
  salesStyle: 'soft' | 'balanced' | 'aggressive' | null;
  emojiDensity: 'low' | 'medium' | 'high' | null;
  consistencyScore: number | null;
}
```

## Kurallar
- API'den gelen veri yetersizse soft-fail + warning mantığı kullanılmalı
- bu fazda reels/video/media pixel analizi zorunlu değil
- caption ve profile tabanlı analiz yeterli

---

# 🧾 5. MANUAL TRAINING SETTINGS

Bu alanlar kullanıcı tarafından girilecek ve brand context'e dahil edilecek.

## Alanlar
- products/services
- faq
- satış kuralları
- yasak cevaplar
- temsilci devri kuralları

## Amaç
Website/Instagram'dan öğrenilemeyen ama iş için kritik olan bilgileri AI'a vermek.

---

# 🧠 6. RESOLVED BRAND CONTEXT

## Amaç
Tüm kaynakları AI için tek bir birleşik yapıya dönüştürmek.

## Örnek yapı

```ts
interface ResolvedBrandContext {
  brandName: string | null;
  toneProfile: {
    primaryTone: string | null;
    toneHints: string[];
    salesStyle: 'soft' | 'balanced' | 'aggressive' | null;
  };
  audienceProfile: {
    targetAudience: string | null;
    positioningHints: string[];
  };
  productKnowledge: Array<{
    name: string;
    summary: string;
    pricePositioning?: string | null;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  responseRules: {
    forbiddenResponses: string[];
    handoffRules: string[];
    customRules: string[];
  };
  sourceSummary: {
    websiteAvailable: boolean;
    instagramAvailable: boolean;
    manualTrainingAvailable: boolean;
  };
}
```

## Kurallar
- website + instagram + manual veri birleştirilmeli
- eksik alanlar null/boş olabilir
- resolved context deterministic şekilde üretilebilmeli
- bu fazda AI synthesis zorunlu değil; rule-based merge yeterlidir
- istenirse ileride AI-based context summarization eklenebilir

---

# 🔁 7. CONTEXT RESOLUTION FLOW

## Akış
1. website snapshot varsa çek
2. instagram snapshot varsa çek
3. training settings çek
4. bunları tek yapıda birleştir
5. resolvedContextJson olarak brand_contexts tablosuna yaz
6. confidence ve source status güncelle

## Service
`brand-context-resolver.service.ts`

Fonksiyon örnekleri:
- resolveForWorkspace(workspaceId)
- getResolvedContext(workspaceId)
- refreshResolvedContext(workspaceId)

---

# 🌐 8. ENDPOINT'LER

## 8.1 Brand context read
GET `/brand-context`

Response:
- current brand context
- source status
- confidence

---

## 8.2 Website analyze trigger
POST `/brand-context/website/analyze`

Request:
```json
{
  "websiteUrl": "https://example.com"
}
```

Behavior:
- website parse et
- snapshot oluştur
- brand context resolve et

---

## 8.3 Instagram analyze trigger
POST `/brand-context/instagram/analyze`

Behavior:
- bağlı Instagram connection üzerinden veri çek
- snapshot oluştur
- brand context resolve et

---

## 8.4 Training settings update
PATCH `/training-settings`

Body:
- productsJson
- faqJson
- rulesJson
- forbiddenResponsesJson
- handoffRulesJson

Behavior:
- settings update et
- brand context resolve et

---

## 8.5 Training settings read
GET `/training-settings`

---

# 🧪 9. TESTLER

## Unit tests
- website signal extraction
- instagram signal extraction
- resolved context merge logic
- confidence/source status calculation

## Integration tests
- website analyze → snapshot created → context resolved
- instagram analyze → snapshot created → context resolved
- training settings patch → context refreshed
- read endpoints valid response dönüyor

---

# ⚠️ 10. ERROR HANDLING

Durumlar:
- invalid website URL
- parse failure
- instagram connection missing
- instagram fetch fail
- malformed training settings

Kurallar:
- mümkün olduğunca partial success yaklaşımı
- source bazlı warning üret
- tüm context'in bozulmasına izin verme

---

# 🪵 11. LOGGING

Loglanması gerekenler:
- website analysis started/completed
- instagram analysis started/completed
- context resolved
- training settings updated
- source missing / partial context warning

Kurallar:
- hassas veri loglama
- uzun raw payload'ları sanitize et

---

# 🚫 12. BU FAZDA YAPILMAYACAKLAR

- AI reply generation
- live message response
- intent detection
- lead stage automation
- handoff execution
- analytics calculations

Bu faz sadece **AI'ın kullanacağı brand context beynini** hazırlar.

---

# ✅ 13. DEFINITION OF DONE

Bu faz tamam sayılır eğer:

- workspace için website analizi yapılabiliyorsa
- bağlı Instagram analizi yapılabiliyorsa
- training settings kaydedilebiliyorsa
- resolved brand context üretilebiliyorsa
- read/update endpoint'leri çalışıyorsa
- context deterministic ve test edilebilir şekilde oluşuyorsa

---

# 📌 14. CODEX NOTU

Bu fazın amacı:

> **AI'ın konuşmadan önce markayı tanıyacağı veri katmanını kurmak**

Henüz AI cevap üretimi yoktur.
Ama Faz 5'te AI provider ve decision engine eklendiğinde bu fazın çıktısı doğrudan kullanılacaktır.

