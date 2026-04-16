# WhatsApp Sales Engine — Phase 11 Spec

## 🎯 Faz 11 Amacı

> Client side tarafında WhatsApp Sales Engine için **UI/UX düzenlemeleri** yaparak, sayfa yapısını tamamen kullanıcı dostu, anlaşılır, operasyonel olarak hızlı ve satış odaklı hale getirmek.

Bu fazın amacı yeni backend özelliği eklemek değildir.
Bu fazın amacı:
- mevcut ekranları sadeleştirmek
- bilgi hiyerarşisini iyileştirmek
- operatör/ajans kullanımı için hız kazandırmak
- onboarding, chat, analytics ve ayarlar ekranlarını daha net hale getirmek
- ürünün “bot” değil, **AI satış sistemi** gibi hissettirmesini sağlamaktır.

---

# 🧱 KAPSAM

Bu fazda ele alınacak alanlar:

- onboarding flow düzeni
- chat ekranı UX iyileştirmeleri
- AI insight paneli düzeni
- lead yönetimi ekranı iyileştirmeleri
- analytics ekranı okunabilirliği
- bilgi mimarisi
- microcopy / CTA dili
- empty / loading / error state tasarımı
- component standardizasyonu
- responsive davranışlar

---

# 🧠 ANA PRENSİP

> Güçlü özellik yetmez; kullanıcı ne yapacağını bir bakışta anlamalıdır.

Bu fazın odağı:
- hızlı anlaşılan arayüz
- minimum bilişsel yük
- satış odaklı karar vermeyi kolaylaştıran ekranlar
- ajans ekibinin günlük kullanımına uygun operasyonel akış

---

# 1. GENEL UX HEDEFLERİ

## 1.1 Hız
- Kullanıcı bir konuşmanın durumunu birkaç saniye içinde anlayabilmeli
- Bir lead’in ne durumda olduğu tek bakışta görülebilmeli
- Kritik aksiyonlar (mesaj gönder, handoff, AI mode değiştir) görünür olmalı

## 1.2 Netlik
- Aynı ekranda gereksiz bilgi yığılması olmamalı
- Her panelin tek bir ana amacı olmalı
- AI insight’lar, chat akışını boğmadan yardımcı olmalı

## 1.3 Güven
- AI’ın neden bu cevabı önerdiği anlaşılır olmalı
- İnsan devri / AI pause gibi kritik modlar net görünmeli
- Hatalar ve eksik durumlar belirsiz kalmamalı

## 1.4 Satış Odaklılık
- Chat ekranı sadece mesajlaşma alanı değil, satış kokpiti gibi hissettirmeli
- Lead stage ve next action görünür olmalı
- Aksiyon önerileri operasyonel olarak uygulanabilir olmalı

---

# 2. SAYFA KAPSAMI

Bu faz aşağıdaki client ekranlarını kapsar:

1. AI Setup / Onboarding
2. AI Ready ekranı
3. Dashboard / Overview
4. Live Chat Interface
5. AI Knowledge / Brand Training
6. Automation Builder
7. Lead Management
8. Analytics
9. WhatsApp Connection sayfası

---

# 3. ONBOARDING / AI SETUP UX

## Amaç
Kullanıcı AI’ı gerçekten “eğitiyormuş” gibi hissetmeli, form dolduruyormuş gibi değil.

## Yapılacaklar
- stepper yapısını güçlendir
- her adımda “bu neden gerekli?” bilgisini kısa açıklamalarla ver
- Website → Instagram → Brand DNA → Products → Rules akışını daha rehberli hale getir
- her adımda kaydet/devam et hissi ver

## Gerekli UX iyileştirmeleri
- analiz sonucu preview kartları ekle
- website parse sonucu görünür olmalı
- Instagram’dan öğrenilen ton / içerik stili görünür olmalı
- Brand DNA adımı editable ama sade olmalı

## Özel durumlar
- website yoksa empty state
- Instagram bağlı değilse teşvik kartı
- analiz sürüyorsa loading state + step mesajları

---

# 4. AI READY EKRANI

## Amaç
Onboarding sonrası başarı hissi yaratmak.

## Yapılacaklar
- başarı ekranını daha kısa ve güçlü yap
- “neler öğrenildi” kısa summary ver
- kullanıcıyı doğrudan canlı konuşmalara veya dashboard’a yönlendir

## İçerik
- Website analyzed ✅
- Instagram analyzed ✅
- Sales style ready ✅
- FAQ / rules loaded ✅

## CTA
- “Canlı Sohbetlere Geç”
- “Dashboard’a Git”

---

# 5. LIVE CHAT INTERFACE UX

## Amaç
Bu ekran ürünün kalbidir. Bir chatbot ekranı değil, satış kokpiti hissi vermelidir.

## Yapılacaklar
### 5.1 Sol panel
- conversation list daha okunabilir hale getir
- unread, hot lead, handoff active, paused AI gibi durumlar badge ile gösterilsin
- filtreler görünür ve sade olsun

### 5.2 Orta panel (chat)
- mesaj balonları WhatsApp hissi vermeli
- AI / human / user mesajları net ayrılmalı
- timestamp ve durum bilgileri okunabilir olmalı
- manuel gönderim alanı temiz ve odaklı olmalı

### 5.3 Sağ panel (AI Brain)
Bu panel çok kritik ve daha iyi bilgi mimarisi gerektirir.

Bölümler:
- Detected intent
- Lead stage
- Objection
- Suggested reply
- Next best action
- Confidence

Kurallar:
- aynı anda her şeyi bağırmamalı
- en kritik 2–3 bilgi üstte görünmeli
- secondary bilgiler collapsible olabilir

## Aksiyonlar
- AI cevaplasın
- Temsilci devral
- AI pause/resume
- Randevu oluştur

Bu butonlar öncelik sırasına göre düzenlenmeli.

---

# 6. DASHBOARD / OVERVIEW UX

## Amaç
Kullanıcıya operasyonun genel sağlığını tek bakışta göstermek.

## Yapılacaklar
- KPI kartları sadeleştirilmeli
- metrikler daha anlamlı başlıklarla sunulmalı
- günlük operasyon kartları ile stratejik kartlar ayrılmalı

## Kart grupları
### Operasyonel
- Incoming messages today
- Active conversations
- AI handled conversations
- Human takeover count

### Satış
- Qualified leads
- Hot leads
- Conversion rate
- Lost lead count

### İçgörü
- Top objections
- Most asked questions
- AI suggestion highlights

---

# 7. LEAD MANAGEMENT UX

## Amaç
Mini CRM ekranını sade ve karar odaklı hale getirmek.

## Yapılacaklar
- tabloya boğulmuş görünüm azaltılmalı
- lead stage renk ve badge sistemi netleşmeli
- hızlı filtreler eklenmeli
- satır aksiyonları sade olmalı

## Gerekli filtreler
- new
- qualified
- hot
- lost
- support
- handoff active

## Hızlı aksiyonlar
- sohbeti aç
- stage güncelle
- not ekle
- temsilciye ata

---

# 8. ANALYTICS UX

## Amaç
Müşteri veya ajans kullanıcısının veriyi hızlı anlaması.

## Yapılacaklar
- fazla chart varsa azalt
- her chart’ın yanında kısa içgörü cümlesi olsun
- funnel daha okunur hale gelsin
- AI performance ayrı blok olarak gösterilsin

## Görsel hiyerarşi
- önce overview
- sonra funnel
- sonra AI metrics
- sonra conversation insights

---

# 9. AI KNOWLEDGE / TRAINING SAYFASI UX

## Amaç
AI’ın bildiği şeyleri kullanıcıya güvenli ve anlaşılır şekilde göstermek.

## Yapılacaklar
- Website data / Instagram data / products / FAQ / rules ayrı sekmeler veya bloklar halinde sunulmalı
- editable alanlar açık olmalı
- “en son ne zaman güncellendi” bilgisi görünmeli
- “yeniden analiz et” aksiyonu net olmalı

---

# 10. AUTOMATION BUILDER UX

## Amaç
Node-based yapı karmaşıklaşmadan anlaşılır kalsın.

## Yapılacaklar
- node tipleri net ayrılmalı
- başlangıç node’u belirgin olmalı
- condition ve handoff node’ları renk/ikon ile ayırt edilmeli
- zoom/pan deneyimi sade olmalı
- fazla karmaşıksa minimal MVP görünümü tercih edilmeli

---

# 11. WHATSAPP CONNECTION SAYFASI UX

## Amaç
Bağlantı durumu teknik değil, anlaşılır biçimde görünmeli.

## Yapılacaklar
- bağlantı var/yok durumu net
- business name / phone number görünür
- reconnect / remove / test connection aksiyonları sade
- hata durumunda kullanıcıyı yönlendiren açıklama olmalı

---

# 12. GLOBAL UI/UX DÜZENLEMELERİ

## 12.1 Navigation
- sidebar sadeleştirilmeli
- benzer alanlar gruplanmalı
- aktif sayfa ve alt durumlar görünür olmalı

## 12.2 Empty States
Her ana ekranda anlamlı empty state olmalı:
- no conversations
- no leads
- no analytics yet
- no brand context
- no WhatsApp connection

## 12.3 Loading States
- skeleton veya hafif loading state kullanılmalı
- özellikle onboarding, chat ve analytics ekranlarında boş beyaz bekleme olmamalı

## 12.4 Error States
- “Bir hata oluştu” yerine yönlendiren mesajlar
- retry butonu
- setup’a dön / yeniden dene aksiyonu

## 12.5 Responsive
- chat ekranı dar ekranlarda kullanılabilir kalmalı
- sağ panel gerektiğinde drawer olabilir
- mobil-first zorunlu değil ama tablet/laptop kırılımları düşünülmeli

---

# 13. MICROCOPY / DİL

## Amaç
Arayüz dili teknik değil, operasyonel ve satış odaklı olmalı.

Örnekler:
- “AI response success rate” yerine “AI ile başarıyla yönetilen konuşmalar” gibi daha anlaşılır dil
- “handoff” yerine kullanıcıya uygun yerde “temsilciye devret”
- teknik hata yerine “Bağlantı kurulamadı, tekrar deneyin”

Kurallar:
- kısa
- güven veren
- aksiyon odaklı

---

# 14. DESIGN SYSTEM DÜZENİ

## Amaç
Tüm ekranlarda tutarlı component davranışı sağlamak.

## Yapılacaklar
- badge sistemi standardize edilmeli
- button hierarchy net olmalı
- card spacing ve padding standardize edilmeli
- status renkleri tutarlı olmalı
- same intent / same stage her yerde aynı görsel dil ile görünmeli

---

# 15. CODE ORGANIZATION (CLIENT)

Bu fazda sadece görsel düzen değil, client tarafı kod organizasyonu da iyileştirilmelidir.

## Beklentiler
- büyük sayfalar daha küçük UI parçalarına bölünsün
- tekrar eden componentler ortaklaştırılsın
- boş / loading / error state componentleri reusable hale getirilsin
- page-level karmaşa azaltılsın

Önerilen client component grupları:
- chat/
- onboarding/
- analytics/
- leads/
- shared/

---

# 16. TEST / QA BEKLENTİSİ

Bu faz UI/UX odaklı olsa da temel doğrulama yapılmalıdır.

## Kontrol listesi
- onboarding akışı kopmuyor mu
- chat ekranında kritik aksiyonlar görünür mü
- AI panel okunabilir mi
- filters gerçekten kullanılabilir mi
- empty/loading/error state’ler tutarlı mı
- responsive kırılmalarda layout bozuluyor mu

---

# ⚠️ BU FAZDA YAPILMAYACAKLAR

- backend mantığı değiştirmek
- yeni AI capability eklemek
- yeni veri modeli eklemek
- yeni entegrasyon başlatmak

Bu faz:
> **mevcut sistemi kullanıcı dostu hale getirme fazıdır**

---

# ✅ DEFINITION OF DONE

Bu faz tamamlanmış sayılır eğer:

- onboarding daha rehberli ve anlaşılır hale geldiyse
- chat ekranı satış kokpiti gibi hissettiriyorsa
- analytics ekranı daha okunaklıysa
- lead management daha operasyonel hale geldiyse
- empty/loading/error state’ler düzenlendiyse
- component standardizasyonu sağlandıysa
- genel bilgi mimarisi belirgin şekilde iyileştiyse

---

# 📌 CODEX NOTU

Bu fazın amacı:

> **Güçlü backend’i, güçlü bir kullanıcı deneyimiyle buluşturmak**

Kullanıcı şunu hissetmeli:
- sistem güçlü
- ama kullanımı zor değil
- AI karmaşık değil, yardımcı
- satış ekibi için gerçek bir operasyon paneli

Yani bu faz, ürünü teknik olarak değil, deneyim olarak olgunlaştıracaktır.

