"use client";

import {
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AdresSecici } from "@/components/adres-secici";
import { CartTotals } from "@/components/cart-lines";
import { OdemeAdimlari } from "@/components/odeme-adimlari";
import { ProductImage } from "@/components/product-image";
import { SozlesmeOnayi } from "@/components/sozlesme-onayi";
import { TeslimatSecimi } from "@/components/teslimat-secimi";
import { useAdresYaz, useCart } from "@/hooks/use-cart";
import { odemeBaslat, odemeIptal, odemeOnayla, odemeOturumu } from "@/lib/api/payment";
import type { PaymentSession, StorefrontAddress } from "@/lib/api/types";
import { fiyat } from "@/lib/format";
import { clientUidAl, odemeIziniSil, oturumUidOku, oturumUidYaz } from "@/lib/odeme-izi";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

/**
 * Ödeme (checkout) — TicariCore'un gerçek akışı:
 *
 *   1. ADRES    cartSetAddress ile iletişim + teslimat sepete yazılır
 *   2. ÖDEME    paymentSessionStart: stok/kur/kampanya CANLI doğrulanır
 *               ("sepette var ama stok bitti" burada yakalanır) ve 3D adresi döner
 *   3. 3D       GERÇEK sağlayıcıda tarayıcı bankanın sayfasına gider ve
 *               /odeme/donus'a döner. TEST sağlayıcısında o adım aşağıdaki
 *               panelde canlandırılır — sonuç yine /odeme/donus'ta gösterilir.
 *
 * SONUÇ EKRANI BU SAYFADA DEĞİL: iki yol da /odeme/donus'a düşer, çünkü gerçek
 * 3D'de müşteri buraya değil oraya döner. Sonucu iki yerde göstermek, ikisinin
 * zamanla birbirinden sapması demektir.
 *
 * KALDIĞI YERDEN DEVAM: sayfa açılışında sepete bağlı açık bir ödeme oturumu
 * varsa geri yüklenir (lib/odeme-izi.ts). Aksi hâlde 3D'den dönen ya da sekmeyi
 * yenileyen müşteri, sepeti donmuş ama ekranı sıfırlanmış hâlde kalırdı.
 *
 * clientUid idempotency anahtarıdır: sepete bağlı üretilir ve saklanır; ağ
 * kopsa da aynı anahtar ikinci oturum/sipariş açtırmaz.
 * Ödeme başladıktan sonra sepet DONAR — vazgeçen için "ödemeyi iptal et" var.
 */

interface AdresForm {
  email: string;
  customerName: string;
  phone: string;
  shipAddress: string;
  shipDistrict: string;
  shipCity: string;
  shipPostalCode: string;
  /**
   * FATURA TİPİ — bireysel ya da kurumsal. Kurumsalda ünvan, VKN ve vergi
   * dairesi zorunludur; e-Arşiv/e-Fatura alıcısı bu alanlardan kurulur.
   * Tip sepete YAZILMAZ: sunucu kurumsal alanların dolu olmasından anlar —
   * ikinci bir "tip" alanı, alanlarla çelişebilecek bir gerçek üretirdi.
   */
  kurumsal: boolean;
  billCompName: string;
  billTaxNumber: string;
  billTaxOffice: string;
}

/** Test sağlayıcısı gerçek bir adrese gitmez; 3D adımı sayfadaki panelde canlanır. */
const TEST_SAGLAYICI = "test";

/** Sonucu kesinleşmiş oturum: müşterinin yeri artık dönüş sayfasıdır. */
const SONUCLANMIS = new Set([3, 4, 5, 6, 7]);

export default function OdemeSayfasi() {
  const router = useRouter();
  const { data: sepet } = useCart();
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  const account = useAuthStore((s) => s.account);
  const adresYaz = useAdresYaz();

  const [adim, setAdim] = useState<"adres" | "odeme">("adres");
  const [form, setForm] = useState<AdresForm>({
    email: account?.email ?? "",
    customerName: account?.fullName ?? "",
    phone: account?.phone ?? "",
    shipAddress: "",
    shipDistrict: "",
    shipCity: "",
    shipPostalCode: "",
    kurumsal: false,
    billCompName: "",
    billTaxNumber: "",
    billTaxOffice: "",
  });
  const [senaryo, setSenaryo] = useState(""); // '' başarılı · 'red' · 'hata'
  const [oturum, setOturum] = useState<PaymentSession | null>(null);
  const [islemde, setIslemde] = useState(false);
  // Sözleşme onayı HER ödeme denemesinde yeniden istenir (saklanmaz):
  // bilgilendirme o siparişe aittir, bir kerelik genel bir onay değildir.
  const [sozlesmeOnayli, setSozlesmeOnayli] = useState(false);

  const dolu = sepet && sepet.status === 0 && sepet.lines.length > 0;

  // --- Formu SEPETTEN ön-doldur (bir kez) ---
  // Adres sepette yaşıyor; sayfa yenilendiğinde ya da 3D'den dönüldüğünde React
  // durumu sıfırlanır ama sepetteki adres durur. Yeniden yazdırmak, müşteriye
  // "az önce doldurduğum form nereye gitti?" dedirtir.
  const formDolduruldu = useRef(false);
  useEffect(() => {
    if (formDolduruldu.current || !sepet) return;
    formDolduruldu.current = true;
    setForm((f) => ({
      email: sepet.email || f.email,
      customerName: sepet.customerName || sepet.shipName || f.customerName,
      phone: sepet.phone || f.phone,
      shipAddress: sepet.shipAddress || f.shipAddress,
      shipDistrict: sepet.shipDistrict || f.shipDistrict,
      shipCity: sepet.shipCity || f.shipCity,
      shipPostalCode: sepet.shipPostalCode || f.shipPostalCode,
      // Kurumsal fatura sepette ünvanın DOLU olmasından anlaşılır: ayrı bir
      // tip alanı yok (bkz. AdresForm.kurumsal).
      kurumsal: Boolean(sepet.billCompName) || f.kurumsal,
      billCompName: sepet.billCompName || f.billCompName,
      billTaxNumber: sepet.billTaxNumber || f.billTaxNumber,
      billTaxOffice: sepet.billTaxOffice || f.billTaxOffice,
    }));
  }, [sepet]);

  // --- Açık ödeme oturumunu geri yükle (bir kez) ---
  // Sonucu kesinleşmiş oturum bu sayfanın işi değildir: müşteri dönüş
  // sayfasına taşınır. Bekleyen oturum ise ekrana geri konur — aksi hâlde
  // sepet donmuş, ekran ise "Ödeme Adımına Geç" der ve müşteri kilitlenir.
  const oturumArandi = useRef(false);
  useEffect(() => {
    if (oturumArandi.current || !cartUid) return;
    oturumArandi.current = true;
    const uid = oturumUidOku(cartUid);
    if (!uid) return;
    let vazgecildi = false;
    void odemeOturumu(uid, token || null).then((s) => {
      if (vazgecildi || !s) return;
      if (SONUCLANMIS.has(s.status)) {
        router.replace(`/odeme/donus?oturum=${encodeURIComponent(s.uid)}`);
        return;
      }
      setOturum(s);
      setAdim("odeme");
    });
    return () => {
      vazgecildi = true;
    };
  }, [cartUid, token, router]);

  const alan = (k: keyof AdresForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  /** Adres defterinden seçim: form doldurulur, müşteri isterse düzenler. */
  const defterdenDoldur = (a: StorefrontAddress) =>
    setForm((f) => ({
      ...f,
      customerName: a.fullName || f.customerName,
      phone: a.phone || f.phone,
      shipAddress: a.address,
      shipDistrict: a.district,
      shipCity: a.city,
      shipPostalCode: a.postalCode,
      kurumsal: Boolean(a.compName) || f.kurumsal,
      billCompName: a.compName || f.billCompName,
      billTaxNumber: a.taxNumber || f.billTaxNumber,
      billTaxOffice: a.taxOffice || f.billTaxOffice,
    }));

  const adresiKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adresYaz.mutateAsync({
        email: form.email,
        customerName: form.customerName,
        phone: form.phone,
        shipName: form.customerName,
        shipAddress: form.shipAddress,
        shipDistrict: form.shipDistrict,
        shipCity: form.shipCity,
        shipPostalCode: form.shipPostalCode,
        // Fatura adresi teslimat adresiyle aynıdır; farklı olan yalnız
        // KURUMSAL alanlardır. Ayrı bir fatura adresi formu bilinçli olarak
        // açılmadı: e-Arşiv alıcısı için gereken kimliktir, ikinci bir adres
        // değil — istenirse API zaten bill* alanlarının tamamını kabul eder.
        billName: form.customerName,
        billAddress: form.shipAddress,
        billDistrict: form.shipDistrict,
        billCity: form.shipCity,
        billPostalCode: form.shipPostalCode,
        billCompName: form.kurumsal ? form.billCompName : "",
        billTaxNumber: form.kurumsal ? form.billTaxNumber : "",
        billTaxOffice: form.kurumsal ? form.billTaxOffice : "",
      });
      setAdim("odeme");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adres kaydedilemedi.");
    }
  };

  const odemeyiBaslat = async () => {
    setIslemde(true);
    try {
      const s = await odemeBaslat({
        cartUid,
        clientUid: clientUidAl(cartUid),
        // Dönüş adresi SONUÇ SAYFASIDIR, bu sayfa değil: sağlayıcı müşteriyi
        // geri gönderdiğinde uygulama sıfırdan boot olur ve burada gösterilecek
        // bir durum kalmaz.
        returnUrl: window.location.origin + "/odeme/donus",
        token: token || null,
      });
      // Oturumu ÖNCE ize yaz, sonra yönlendir: yönlendirmeden sonra bu sayfanın
      // kodu bir daha çalışmayabilir ve oturumun izi kalmazsa dönen müşteriyi
      // hangi ödemeye bağlayacağımızı bilemeyiz.
      oturumUidYaz(cartUid, s.uid);
      // GERÇEK sağlayıcı: tarayıcı bankanın 3D sayfasına gider.
      // TEST sağlayıcısı: adresi (test-odeme.local) çözülmez, o adım aşağıdaki
      // panelde canlandırılır.
      if (s.providerCode !== TEST_SAGLAYICI && s.redirectUrl) {
        window.location.assign(s.redirectUrl);
        return;
      }
      setOturum(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ödeme başlatılamadı.");
    } finally {
      setIslemde(false);
    }
  };

  const odemeyiOnayla = async () => {
    if (!oturum) return;
    setIslemde(true);
    try {
      const s = await odemeOnayla(oturum.uid, senaryo, token || null);
      // Tahsil edildi (sipariş doğdu) ya da yetkilendirildi: ikisinin de yeri
      // dönüş sayfasıdır — sepetin temizliğini de orası yapar, çünkü gerçek 3D
      // akışında bu kod hiç çalışmaz.
      if (s.status === 3 || s.status === 2) {
        router.replace(`/odeme/donus?oturum=${encodeURIComponent(s.uid)}`);
        return;
      }
      // Başarısız oturum aynı clientUid ile YENİDEN başlatılabilir; müşteriyi
      // buradan çıkarmıyoruz ki sepetini kaybetmeden tekrar denesin.
      setOturum(s);
      toast.error(s.errorMessage || s.statusLabel || "Ödeme tamamlanamadı.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ödeme onaylanamadı.");
    } finally {
      setIslemde(false);
    }
  };

  const odemeyiVazgec = async () => {
    if (!oturum) return;
    setIslemde(true);
    try {
      await odemeIptal(oturum.uid, token || null);
      // İptal edilen oturum aynı clientUid ile OLDUĞU GİBİ döner (backend
      // ikinci çekime izin vermez) — yeni deneme için iz temizlenir.
      odemeIziniSil(cartUid);
      setOturum(null);
      toast.info("Ödeme iptal edildi — sepetiniz tekrar düzenlenebilir.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İptal edilemedi.");
    } finally {
      setIslemde(false);
    }
  };

  // ---- SEPET BOŞ ----
  if (!dolu) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="font-medium">Ödenecek bir sepet yok</p>
        <button
          type="button"
          onClick={() => router.push("/urunler")}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          Alışverişe Başla
        </button>
      </div>
    );
  }

  const girdiSinifi =
    "h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="mb-5 space-y-4">
        <h1 className="text-2xl font-bold">Ödeme</h1>
        <OdemeAdimlari aktif={adim === "adres" ? "adres" : oturum ? "odeme" : "teslimat"} />
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* ADIM 1: ADRES */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="size-4.5 text-accent" /> Teslimat Bilgileri
            </h2>
            {adim === "adres" ? (
              <div className="space-y-4">
                <AdresSecici onSec={defterdenDoldur} />
                <form onSubmit={adresiKaydet} className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  type="email"
                  placeholder="E-posta *"
                  value={form.email}
                  onChange={(e) => alan("email", e.target.value)}
                  className={girdiSinifi}
                />
                <input
                  required
                  placeholder="Ad Soyad *"
                  value={form.customerName}
                  onChange={(e) => alan("customerName", e.target.value)}
                  className={girdiSinifi}
                />
                <input
                  placeholder="Telefon"
                  value={form.phone}
                  onChange={(e) => alan("phone", e.target.value)}
                  className={girdiSinifi}
                />
                <input
                  required
                  placeholder="İl *"
                  value={form.shipCity}
                  onChange={(e) => alan("shipCity", e.target.value)}
                  className={girdiSinifi}
                />
                <input
                  placeholder="İlçe"
                  value={form.shipDistrict}
                  onChange={(e) => alan("shipDistrict", e.target.value)}
                  className={girdiSinifi}
                />
                <input
                  placeholder="Posta kodu"
                  value={form.shipPostalCode}
                  onChange={(e) => alan("shipPostalCode", e.target.value)}
                  className={girdiSinifi}
                />
                <textarea
                  required
                  placeholder="Açık adres *"
                  value={form.shipAddress}
                  onChange={(e) => alan("shipAddress", e.target.value)}
                  rows={2}
                  className="rounded-xl border border-line bg-background p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 sm:col-span-2"
                />

                {/* FATURA TİPİ — kurumsal seçilirse e-Arşiv alıcısı için
                    ünvan/VKN/vergi dairesi gerekir; bireyselde hiç sorulmaz. */}
                <div className="space-y-3 rounded-xl border border-line p-3 sm:col-span-2">
                  <div className="flex gap-2">
                    {[
                      { k: false, ad: "Bireysel" },
                      { k: true, ad: "Kurumsal" },
                    ].map((t) => (
                      <button
                        key={t.ad}
                        type="button"
                        onClick={() => alan("kurumsal", t.k)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          form.kurumsal === t.k
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-line hover:border-soft"
                        }`}
                      >
                        {t.ad} Fatura
                      </button>
                    ))}
                  </div>
                  {form.kurumsal ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        required
                        placeholder="Firma ünvanı *"
                        value={form.billCompName}
                        onChange={(e) => alan("billCompName", e.target.value)}
                        className={`${girdiSinifi} sm:col-span-2`}
                      />
                      <input
                        required
                        inputMode="numeric"
                        placeholder="Vergi / TC kimlik no *"
                        value={form.billTaxNumber}
                        onChange={(e) => alan("billTaxNumber", e.target.value)}
                        className={girdiSinifi}
                      />
                      <input
                        placeholder="Vergi dairesi"
                        value={form.billTaxOffice}
                        onChange={(e) => alan("billTaxOffice", e.target.value)}
                        className={girdiSinifi}
                      />
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={adresYaz.isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40 sm:col-span-2"
                >
                  {adresYaz.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Teslimat Adımına Geç
                </button>
                </form>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 text-sm">
                <div className="text-soft">
                  <p className="font-medium text-foreground">{form.customerName}</p>
                  <p>{form.shipAddress}</p>
                  <p>
                    {form.shipDistrict ? `${form.shipDistrict}, ` : ""}
                    {form.shipCity}
                  </p>
                  <p>{form.email}</p>
                </div>
                {!oturum ? (
                  <button
                    type="button"
                    onClick={() => setAdim("adres")}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Düzenle
                  </button>
                ) : null}
              </div>
            )}
          </section>

          {/* ADIM 2: TESLİMAT */}
          {/* Adres yazıldıktan sonra görünür: ücret sepetin net matrahına bağlı
              olduğu için seçim, tutarı da değiştirir — bu yüzden ödemeden ÖNCE
              yapılmalı. Kanalda tanımlı yöntem yoksa bölüm hiç çizilmez
              (teslimatsız kurulumlar için boş bir kutu göstermenin anlamı yok). */}
          {adim === "odeme" && !oturum ? <TeslimatSecimi /> : null}
          {adim === "odeme" && oturum ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <Truck className="size-4.5 text-accent" /> Teslimat
              </h2>
              <p className="text-sm text-soft">
                {sepet.shipCity ? `${sepet.shipCity} · ` : ""}
                {Number(sepet.shippingFee) > 0
                  ? fiyat(sepet.shippingFee, sepet.curCode)
                  : "Ücretsiz kargo"}
              </p>
            </section>
          ) : null}

          {/* ADIM 3: ÖDEME */}
          {adim === "odeme" ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <CreditCard className="size-4.5 text-accent" /> Ödeme
              </h2>

              {!oturum ? (
                <div className="space-y-4">
                  <p className="text-sm text-soft">
                    Bu demo, TicariCore'un <strong>test ödeme sağlayıcısını</strong> kullanır —
                    gerçek bir karta gidilmez. Senaryo seçip akışı deneyin:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: "", ad: "✓ Başarılı ödeme" },
                      { v: "red", ad: "✗ Kart reddedildi" },
                      { v: "hata", ad: "⚠ Banka iletişim hatası" },
                    ].map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setSenaryo(s.v)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          senaryo === s.v
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-line hover:border-soft"
                        }`}
                      >
                        {s.ad}
                      </button>
                    ))}
                  </div>
                  <SozlesmeOnayi
                    sepet={sepet}
                    onayli={sozlesmeOnayli}
                    onChange={setSozlesmeOnayli}
                  />
                  <button
                    type="button"
                    onClick={odemeyiBaslat}
                    disabled={islemde || !sozlesmeOnayli}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
                  >
                    {islemde ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Lock className="size-4.5" />
                    )}
                    Güvenli Ödemeyi Başlat
                  </button>
                  <p className="text-xs text-soft">
                    Bu adımda stok, kur ve kampanyalar sunucuda bir kez daha doğrulanır.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 3D Secure simülasyon paneli */}
                  <div className="rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldCheck className="size-4.5 text-accent" /> 3D Secure Doğrulama
                      (simülasyon)
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-soft">
                      {oturum.redirectUrl || oturum.statusLabel}
                    </p>
                    <p className="mt-2 text-xs text-soft">
                      Gerçek entegrasyonda müşteri bankanın 3D sayfasına yönlendirilir;
                      test sağlayıcısında bu panel o adımı temsil eder.
                    </p>
                  </div>
                  {oturum.errorMessage ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-danger">
                      <XCircle className="size-4" /> {oturum.errorMessage}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={odemeyiOnayla}
                      disabled={islemde}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
                    >
                      {islemde ? <Loader2 className="size-5 animate-spin" /> : null}
                      Doğrula ve Öde
                    </button>
                    <button
                      type="button"
                      onClick={odemeyiVazgec}
                      disabled={islemde}
                      className="h-12 rounded-xl border border-line px-4 text-sm font-semibold transition hover:bg-background disabled:opacity-40"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </div>

        {/* SİPARİŞ ÖZETİ */}
        <aside className="h-fit rounded-2xl border border-line bg-surface p-4 md:sticky md:top-32">
          <h2 className="mb-3 font-semibold">Sipariş Özeti</h2>
          <ul className="mb-3 max-h-72 space-y-2 overflow-y-auto text-sm">
            {sepet.lines.map((l) => (
              <li key={l.lineUid || l.productUid} className="flex items-center gap-2">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-background">
                  <ProductImage src={l.imageUrl} alt={l.name} sizes="48px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{l.name}</span>
                  <span className="block text-xs text-soft">
                    {Number(l.quantity)} adet
                    {l.paramSummary ? ` · ${l.paramSummary}` : ""}
                  </span>
                </span>
                <span className="shrink-0 font-medium">{fiyat(l.lineTotal, sepet.curCode)}</span>
              </li>
            ))}
          </ul>
          <CartTotals sepet={sepet} />
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-soft">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Ödeme bilgileriniz mağazada saklanmaz; işlem 3D Secure ile yapılır.
          </p>
        </aside>
      </div>
    </div>
  );
}
