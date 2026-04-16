import { RefreshCw, Save, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function AIKnowledge() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1400px] p-6 md:p-8">
        <PageHeader
          title="AI Knowledge / Training"
          description="AI'in bildigi kaynaklari blok bazli yonet, editable alanlarla guvenli sekilde guncelle."
          badge="Son guncelleme: 2 saat once"
          actions={[
            {
              id: 'reanalyze',
              label: 'Yeniden analiz et',
              variant: 'secondary',
              icon: <RefreshCw className="h-4 w-4" />,
            },
          ]}
        />

        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Website kayitlari</p>
            <p className="text-2xl font-bold">16</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Instagram sinyali</p>
            <p className="text-2xl font-bold">11</p>
          </article>
          <article className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">FAQ + rules</p>
            <p className="text-2xl font-bold">22</p>
          </article>
          <article className="rounded-xl border border-primary/35 bg-primary/10 p-4">
            <p className="text-xs text-muted-foreground">AI readiness</p>
            <p className="text-2xl font-bold text-primary">%94</p>
          </article>
        </section>

        <Tabs defaultValue="website" className="rounded-xl border border-border bg-card/60 p-4">
          <TabsList className="h-auto w-full flex-wrap gap-1 bg-secondary/45 p-1">
            <TabsTrigger value="website">Website data</TabsTrigger>
            <TabsTrigger value="instagram">Instagram data</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="website" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-1 text-sm font-semibold">Parse ozeti</p>
              <p className="text-sm text-muted-foreground">
                Marka tonu: profesyonel, cozum odakli. Konumlandirma: AI destekli
                satis otomasyonu.
              </p>
            </article>
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Editable website notes</p>
              <textarea
                rows={5}
                defaultValue="Prompta AI, satis ekiplerinin WhatsApp operasyonunu AI ile yoneten bir platformdur. Hedef kitle: KOBI ve buyuyen ekipler."
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="instagram" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-1 text-sm font-semibold">Icerik ve ton</p>
              <p className="text-sm text-muted-foreground">
                Egitici + modern icerik baskin. Emojiler kontrollu kullaniliyor.
              </p>
            </article>
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Ton ayari</p>
              <textarea
                rows={5}
                defaultValue="Instagram iceriginde sade, ikna edici ve guven veren bir dil kullan. Fazla teknik jargondan kacın."
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="products" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Urun bilgisi</p>
              <textarea
                rows={7}
                defaultValue="Starter: 2,999 TL | Business: 4,999 TL | Enterprise: 9,999 TL. Tum paketlerde AI sohbet, lead yonetimi, analytics modulleri bulunur."
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="faq" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">FAQ editor</p>
              <textarea
                rows={8}
                defaultValue="S: Deneme surumu var mi?\nC: Evet, 14 gun ucretsiz.\n\nS: Kurulum ne kadar surer?\nC: Ortalama 2 is gunu.\n\nS: Hangi kanallar destekleniyor?\nC: WhatsApp odakli, genisleme calismalari suruyor."
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-3">
            <article className="rounded-lg border border-border bg-secondary/35 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Sales rules</p>
              <textarea
                rows={8}
                defaultValue="- Fiyat indirimi vaadi verme.\n- Teknik krizde handoff tetikle.\n- Musteri sinirli ise AI tonu yumusat ve temsilci davet et.\n- Demoya uygun leadlerde 2 adimdan fazla bekleme."
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </article>
          </TabsContent>
        </Tabs>

        <footer className="sticky bottom-0 mt-6 flex items-center justify-between rounded-xl border border-border bg-card/85 p-4 backdrop-blur">
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Degisiklikler kaydedildikten sonra AI yanitlarina yansir.
          </p>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Kaydet
          </button>
        </footer>
      </div>
    </div>
  );
}
