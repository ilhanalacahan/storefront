"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, BellRing, ChevronDown, Heart, KeyRound, Loader2, LogOut, MapPin, Package, Pencil, Plus, Trash2, TrendingDown, User, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import {
  adresKaydet,
  adresSil,
  adreslerim,
  dogrulamaMailiGonder,
  girisYap,
  kayitOl,
  profilGuncelle,
  sifreDegistir,
  siparisDetay,
  siparislerim,
  talepAc,
  type StorefrontOrderDetail,
} from "@/lib/api/account";
import type { StorefrontAddress } from "@/lib/api/types";
import { TalepListesi } from "@/components/siparis-detay";
import { alarmSil, alarmlariGetir, type UrunAlarmi } from "@/lib/api/alarm";
import { sepetBirlestir } from "@/lib/api/cart";
import type { StorefrontAuthPayload } from "@/lib/api/types";
import { fiyat, miktar, ODEME_DURUM, SIPARIS_DURUM, tarih } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

/**
 * Hesap — girişsizken giriş/kayıt sekmeleri, girişliyken profil + siparişler
 * + adresler. Hesaplar KANAL kapsamlıdır (aynı e-posta başka sitede başka hesap).
 *
 * SEPET BİRLEŞTİRME: girişten hemen sonra misafir sepeti varsa cartMerge ile
 * hesaba taşınır — "üye olunca sepetim uçtu" yaşanmaz. Dönen sepetin uid'i
 * saklanır (birleşmede değişebilir).
 */
export default function HesapSayfasi() {
  const token = useAuthStore((s) => s.token);
  // Suspense ŞART: HesapPaneli useSearchParams okur (sekme adresten gelir) ve
  // Next bunu sınır olmadan statik sayfada kabul etmez.
  return token ? (
    <Suspense>
      <HesapPaneli />
    </Suspense>
  ) : (
    <GirisKayit />
  );
}

/** Panel sekmeleri — adres `?sekme=` ile paylaşılabilir (header menüsü de bunu kullanır). */
const SEKMELER = [
  { anahtar: "ozet", etiket: "Hesap Bilgilerim", Icon: User },
  { anahtar: "siparisler", etiket: "Siparişlerim", Icon: Package },
  { anahtar: "adresler", etiket: "Adreslerim", Icon: MapPin },
  { anahtar: "alarmlar", etiket: "Alarmlarım", Icon: BellRing },
] as const;

type SekmeAnahtari = (typeof SEKMELER)[number]["anahtar"];

// ---------------------------------------------------------------------------
// Giriş / Kayıt
// ---------------------------------------------------------------------------

function GirisKayit() {
  const signIn = useAuthStore((s) => s.signIn);
  const cartUid = useCartStore((s) => s.cartUid);
  const setCartUid = useCartStore((s) => s.setCartUid);
  const qc = useQueryClient();

  const [mod, setMod] = useState<"giris" | "kayit">("giris");
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [busy, setBusy] = useState(false);

  const oturumAc = async (p: StorefrontAuthPayload) => {
    signIn(p.token, p.account);
    // Misafir sepeti hesaba taşınır; uid değişebilir.
    if (cartUid) {
      try {
        const sepet = await sepetBirlestir(cartUid, p.token);
        setCartUid(sepet.uid);
        qc.setQueryData(["sepet", sepet.uid], sepet);
      } catch {
        /* misafir sepeti boş/geçersizse birleşme atlanır — giriş yine geçerli */
      }
    }
    toast.success(`Hoş geldiniz${p.account.fullName ? ", " + p.account.fullName : ""}!`);
  };

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mod === "giris") {
        await oturumAc(await girisYap(email, parola));
      } else {
        if (!kvkk) {
          toast.error("Kayıt için KVKK aydınlatma metnini onaylamanız gerekir.");
          return;
        }
        await oturumAc(
          await kayitOl({ email, password: parola, fullName: adSoyad, kvkkAccepted: true }),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const girdiSinifi =
    "h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-5 flex rounded-xl bg-background p-1">
          {(["giris", "kayit"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMod(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mod === m ? "bg-surface shadow-sm" : "text-soft"
              }`}
            >
              {m === "giris" ? "Giriş Yap" : "Üye Ol"}
            </button>
          ))}
        </div>

        <form onSubmit={gonder} className="space-y-3">
          {mod === "kayit" ? (
            <input
              placeholder="Ad Soyad"
              value={adSoyad}
              onChange={(e) => setAdSoyad(e.target.value)}
              className={girdiSinifi}
            />
          ) : null}
          <input
            required
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={girdiSinifi}
          />
          <input
            required
            type="password"
            placeholder="Parola (en az 8 karakter)"
            value={parola}
            minLength={8}
            onChange={(e) => setParola(e.target.value)}
            className={girdiSinifi}
          />
          {mod === "kayit" ? (
            <label className="flex items-start gap-2 text-xs text-soft">
              <input
                type="checkbox"
                checked={kvkk}
                onChange={(e) => setKvkk(e.target.checked)}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span>
                <Link
                  href="/sozlesmeler/gizlilik"
                  target="_blank"
                  className="text-accent hover:underline"
                >
                  KVKK aydınlatma metnini
                </Link>{" "}
                okudum, kişisel verilerimin işlenmesini onaylıyorum. *
              </span>
            </label>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mod === "giris" ? "Giriş Yap" : "Hesap Oluştur"}
          </button>
        </form>
        {mod === "giris" ? (
          <>
            <p className="mt-3 text-center text-sm">
              <Link href="/sifre-sifirla" className="text-accent hover:underline">
                Parolamı unuttum
              </Link>
            </p>
            <p className="mt-2 text-center text-xs text-soft">
              Sepetiniz giriş sonrası hesabınıza otomatik taşınır.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hesap paneli
// ---------------------------------------------------------------------------

/**
 * HESAP PANELİ — solda menü, sağda seçili bölüm.
 *
 * SEKME ADRESTEDİR (?sekme=siparisler): üst çubuktaki hesap menüsü doğrudan
 * "Siparişlerim"e bağlanabilsin ve müşteri bağlantıyı paylaşabilsin diye.
 * Bilinmeyen değer özete düşer — yazım hatası hesabı boş göstermez.
 *
 * Eski tek sütunlu düzende profil, siparişler ve adresler alt alta uzuyordu;
 * beş siparişi olan müşteri adres defterine ulaşmak için sayfayı sonuna kadar
 * kaydırmak zorundaydı.
 */
function HesapPaneli() {
  const token = useAuthStore((s) => s.token);
  const account = useAuthStore((s) => s.account);
  const signOut = useAuthStore((s) => s.signOut);
  const clearCart = useCartStore((s) => s.clearCart);
  const params = useSearchParams();

  const istenen = params.get("sekme") ?? "";
  const aktif: SekmeAnahtari = SEKMELER.some((s) => s.anahtar === istenen)
    ? (istenen as SekmeAnahtari)
    : "ozet";

  const siparisQ = useQuery({
    queryKey: ["siparisler"],
    queryFn: () => siparislerim(token),
    enabled: aktif === "siparisler",
  });

  const cikis = () => {
    signOut();
    clearCart(); // hesaba bağlı sepet misafir uid'iyle zaten açılamaz
    toast.info("Çıkış yapıldı.");
  };

  return (
    <div className="space-y-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <User className="size-6 text-accent" /> Hesabım
        </h1>
        <button
          type="button"
          onClick={cikis}
          className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-soft transition hover:text-danger"
        >
          <LogOut className="size-4" /> Çıkış
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <nav className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="border-b border-line p-4">
              <p className="truncate font-semibold">{account?.fullName || "Hesabım"}</p>
              <p className="truncate text-xs text-soft">{account?.email}</p>
            </div>
            <ul className="p-2">
              {SEKMELER.map((s) => (
                <li key={s.anahtar}>
                  <Link
                    href={`/hesap?sekme=${s.anahtar}`}
                    scroll={false}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                      s.anahtar === aktif
                        ? "bg-accent/10 font-semibold text-accent"
                        : "text-soft hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <s.Icon className="size-4" aria-hidden />
                    {s.etiket}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/favoriler"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-soft transition hover:bg-background hover:text-foreground"
                >
                  <Heart className="size-4" aria-hidden />
                  Favorilerim
                </Link>
              </li>
              <li>
                <Link
                  href="/siparis-sorgula"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-soft transition hover:bg-background hover:text-foreground"
                >
                  <Package className="size-4" aria-hidden />
                  Sipariş Sorgula
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 space-y-5">
          {aktif === "ozet" ? <ProfilBolumu /> : null}

          {aktif === "siparisler" ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <Package className="size-4.5 text-accent" /> Siparişlerim
              </h2>
              {siparisQ.isPending ? (
                <div className="h-16 animate-pulse rounded-xl bg-line/40" />
              ) : !siparisQ.data?.length ? (
                <p className="text-sm text-soft">
                  Henüz siparişiniz yok. İlk siparişinizde burada görünecek.
                </p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {siparisQ.data.map((s) => (
                    <SiparisSatiri key={s.uid} siparis={s} />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {aktif === "adresler" ? <AdreslerBolumu /> : null}

          {aktif === "alarmlar" ? <AlarmlarBolumu /> : null}
        </div>
      </div>
    </div>
  );
}

/** Sipariş satırı — tıklanınca satır detayları (storefrontOrder) açılır. */
function SiparisSatiri({
  siparis,
}: {
  siparis: { uid: string; docNum: string; issueDate: string; total: string; curCode: number; orderState: number; paymentState: number };
}) {
  const token = useAuthStore((s) => s.token);
  const [acik, setAcik] = useState(false);
  const detayQ = useQuery({
    queryKey: ["siparis-detay", siparis.uid],
    queryFn: () => siparisDetay(token, siparis.uid),
    enabled: acik, // detay yalnız açılınca çekilir
    staleTime: 60_000,
  });

  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
      >
        <div>
          <p className="font-mono text-xs text-soft">{siparis.docNum || siparis.uid.slice(0, 8)}</p>
          <p className="text-xs text-soft">{tarih(siparis.issueDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {SIPARIS_DURUM[siparis.orderState] ?? siparis.orderState}
          </span>
          <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {ODEME_DURUM[siparis.paymentState] ?? siparis.paymentState}
          </span>
          <span className="font-semibold">{fiyat(siparis.total, siparis.curCode)}</span>
          <ChevronDown
            className={`size-4 text-soft transition-transform ${acik ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {acik ? (
        <div className="mt-3 rounded-xl border border-line bg-background p-3">
          {detayQ.isPending ? (
            <div className="h-10 animate-pulse rounded-lg bg-line/40" />
          ) : !detayQ.data ? (
            <p className="text-xs text-soft">Detay yüklenemedi.</p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {detayQ.data.lines.map((l, i) => (
                  <li
                    key={l.productUid + i}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate">
                      {l.name}
                      <span className="ml-1 text-soft">
                        ×{miktar(l.quantity)}
                        {l.unit ? ` ${l.unit}` : ""} · {fiyat(l.unitPrice, siparis.curCode)}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {fiyat(l.lineTotal, siparis.curCode)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* TESLİMAT — "kargom nerede?" sorusunun cevabı.
                  Takip numarası mağaza girene kadar boştur; boşken satır hiç
                  çizilmez, çünkü boş bir "Takip No: —" satırı müşteriye
                  kargonun kaybolduğunu düşündürür. */}
              {detayQ.data.shipperCompName ||
              detayQ.data.trackingCode ||
              Number(detayQ.data.shippingFee) > 0 ? (
                <dl className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                  {detayQ.data.shipperCompName ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-soft">Teslimat</dt>
                      <dd>{detayQ.data.shipperCompName}</dd>
                    </div>
                  ) : null}
                  {Number(detayQ.data.shippingFee) > 0 ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-soft">Kargo Ücreti</dt>
                      <dd>{fiyat(detayQ.data.shippingFee, siparis.curCode)}</dd>
                    </div>
                  ) : null}
                  {detayQ.data.trackingCode ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-soft">Takip No</dt>
                      <dd className="font-mono">{detayQ.data.trackingCode}</dd>
                    </div>
                  ) : null}
                  {detayQ.data.despatchAddress ? (
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-soft">Adres</dt>
                      <dd className="text-right">
                        {detayQ.data.despatchAddress}
                        {detayQ.data.despatchCity ? `, ${detayQ.data.despatchCity}` : ""}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <TalepAlani detay={detayQ.data} siparisUid={siparis.uid} />
              <div className="mt-3 border-t border-line pt-2 text-right">
                <Link
                  href={`/hesap/siparis/${siparis.uid}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Yazdır / PDF
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

/**
 * İptal / iade talebi — düğmeler sunucunun canCancel/canReturn bayrağına
 * bağlıdır; gerekçe zorunlu. Dönen detay cache'e yazılır (yeniden çekilmez).
 * Talep belgeyi değiştirmez: mağaza karar verir, not müşteriye görünür.
 */
function TalepAlani({ detay, siparisUid }: { detay: StorefrontOrderDetail; siparisUid: string }) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [acik, setAcik] = useState<1 | 2 | null>(null);
  const [gerekce, setGerekce] = useState("");
  const talep = useMutation({
    mutationFn: ({ kind, reason }: { kind: 1 | 2; reason: string }) => talepAc(token, siparisUid, kind, reason),
    onSuccess: (yeni) => {
      qc.setQueryData(["siparis-detay", siparisUid], yeni);
      toast.success("Talebiniz alındı; mağaza inceleyip size döner.");
      setAcik(null);
      setGerekce("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Talep açılamadı."),
  });

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      {detay.requests.length ? <TalepListesi talepler={detay.requests} /> : null}
      {detay.canCancel || detay.canReturn ? (
        acik === null ? (
          <div className="flex flex-wrap gap-2">
            {detay.canCancel ? (
              <button type="button" onClick={() => setAcik(1)} className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium hover:border-danger hover:text-danger">
                İptal talebi aç
              </button>
            ) : null}
            {detay.canReturn ? (
              <button type="button" onClick={() => setAcik(2)} className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent">
                İade talebi aç
              </button>
            ) : null}
          </div>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              talep.mutate({ kind: acik, reason: gerekce });
            }}
          >
            <p className="text-xs font-medium">{acik === 1 ? "İptal talebi" : "İade talebi"} — gerekçenizi yazın</p>
            <textarea
              value={gerekce}
              rows={3}
              maxLength={2000}
              required
              disabled={talep.isPending}
              placeholder={acik === 1 ? "Örn. yanlış adres girdim" : "Örn. ürün hasarlı geldi"}
              onChange={(e) => setGerekce(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={talep.isPending || gerekce.trim().length < 3}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-40"
              >
                {talep.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Gönder
              </button>
              <button type="button" disabled={talep.isPending} onClick={() => setAcik(null)} className="rounded-xl border border-line px-3 py-1.5 text-xs">
                Vazgeç
              </button>
            </div>
          </form>
        )
      ) : null}
    </div>
  );
}

const girdiSinifi =
  "h-10 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

/**
 * PROFİL — ad/telefon/pazarlama izni düzenleme ve parola değiştirme.
 *
 * Sunucu bu iki ucu (PUT /account/me, PUT /account/password) uzun süredir
 * sunuyordu; vitrinde kapısı yoktu. Parola değişimi eski parolayı ister —
 * oturum çalınmış olsa bile parola değiştirilemez.
 */
function ProfilBolumu() {
  const token = useAuthStore((s) => s.token);
  const account = useAuthStore((s) => s.account);
  const signIn = useAuthStore((s) => s.signIn);
  const [duzenle, setDuzenle] = useState(false);
  const [parolaAcik, setParolaAcik] = useState(false);
  const [adSoyad, setAdSoyad] = useState(account?.fullName ?? "");
  const [telefon, setTelefon] = useState(account?.phone ?? "");
  const [pazarlama, setPazarlama] = useState(account?.marketingConsent ?? false);
  const [eskiParola, setEskiParola] = useState("");
  const [yeniParola, setYeniParola] = useState("");
  const [busy, setBusy] = useState(false);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const hesap = await profilGuncelle(token, {
        fullName: adSoyad,
        phone: telefon,
        marketingConsent: pazarlama,
      });
      signIn(token, hesap);
      setDuzenle(false);
      toast.success("Profil güncellendi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Profil güncellenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const parolaDegistir = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await sifreDegistir(token, eskiParola, yeniParola);
      setEskiParola("");
      setYeniParola("");
      setParolaAcik(false);
      toast.success("Parola değiştirildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Parola değiştirilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
      {duzenle ? (
        <form onSubmit={kaydet} className="space-y-3">
          <input
            placeholder="Ad Soyad"
            value={adSoyad}
            onChange={(e) => setAdSoyad(e.target.value)}
            className={girdiSinifi}
          />
          <input
            placeholder="Telefon"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            className={girdiSinifi}
          />
          <label className="flex items-center gap-2 text-xs text-soft">
            <input
              type="checkbox"
              checked={pazarlama}
              onChange={(e) => setPazarlama(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Kampanya ve duyuru e-postası almak istiyorum
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Kaydet
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setDuzenle(false)}
              className="h-10 rounded-xl border border-line px-4 font-medium text-soft"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{account?.fullName || "—"}</p>
            <p className="text-soft">{account?.email}</p>
            {account?.phone ? <p className="text-soft">{account.phone}</p> : null}
            <EpostaDurumu />
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              title="Profili düzenle"
              onClick={() => {
                setAdSoyad(account?.fullName ?? "");
                setTelefon(account?.phone ?? "");
                setPazarlama(account?.marketingConsent ?? false);
                setDuzenle(true);
              }}
              className="flex size-9 items-center justify-center rounded-xl border border-line text-soft transition hover:text-accent"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              title="Parolayı değiştir"
              onClick={() => setParolaAcik((v) => !v)}
              className="flex size-9 items-center justify-center rounded-xl border border-line text-soft transition hover:text-accent"
            >
              <KeyRound className="size-4" />
            </button>
          </div>
        </div>
      )}
      {parolaAcik ? (
        <form onSubmit={parolaDegistir} className="mt-4 space-y-2 border-t border-line pt-4">
          <p className="text-xs font-semibold">Parolayı değiştir</p>
          <input
            required
            type="password"
            placeholder="Mevcut parola"
            value={eskiParola}
            onChange={(e) => setEskiParola(e.target.value)}
            className={girdiSinifi}
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Yeni parola (en az 8 karakter)"
            value={yeniParola}
            onChange={(e) => setYeniParola(e.target.value)}
            className={girdiSinifi}
          />
          <button
            type="submit"
            disabled={busy}
            className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Parolayı Güncelle
          </button>
        </form>
      ) : null}
    </section>
  );
}

const BOS_ADRES: Partial<StorefrontAddress> & { address: string } = {
  title: "",
  fullName: "",
  phone: "",
  address: "",
  district: "",
  city: "",
  country: "Türkiye",
  postalCode: "",
  isDefaultShip: false,
  isDefaultBill: false,
};

/**
 * ADRESLER — liste + ekle/düzenle/sil. Yeni kayıt POST, var olan PUT; ikisi
 * de aynı sarmalayıcıdan geçer (uid boş/dolu). Silme geri alınamaz ama
 * verilmiş siparişler adresi kendi damgasında taşır — geçmiş etkilenmez.
 */
function AdreslerBolumu() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const adresQ = useQuery({
    queryKey: ["adresler"],
    queryFn: () => adreslerim(token),
  });
  const [form, setForm] = useState<(Partial<StorefrontAddress> & { address: string }) | null>(null);
  const [duzenlenenUid, setDuzenlenenUid] = useState("");
  const [busy, setBusy] = useState(false);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.address?.trim() || !form.city?.trim()) {
      toast.error("Adres ve şehir zorunludur.");
      return;
    }
    setBusy(true);
    try {
      await adresKaydet(token, form, duzenlenenUid);
      await qc.invalidateQueries({ queryKey: ["adresler"] });
      setForm(null);
      setDuzenlenenUid("");
      toast.success(duzenlenenUid ? "Adres güncellendi." : "Adres eklendi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adres kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const sil = async (a: StorefrontAddress) => {
    if (!confirm(`"${a.title || a.address}" adresi silinsin mi?`)) return;
    setBusy(true);
    try {
      await adresSil(token, a.uid);
      await qc.invalidateQueries({ queryKey: ["adresler"] });
      toast.success("Adres silindi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adres silinemedi.");
    } finally {
      setBusy(false);
    }
  };

  const alan = (k: keyof StorefrontAddress, placeholder: string, gerekli = false) => (
    <input
      required={gerekli}
      placeholder={placeholder}
      value={(form?.[k] as string) ?? ""}
      onChange={(e) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f))}
      className={girdiSinifi}
    />
  );

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <MapPin className="size-4.5 text-accent" /> Adreslerim
        </h2>
        {!form ? (
          <button
            type="button"
            onClick={() => {
              setDuzenlenenUid("");
              setForm({ ...BOS_ADRES });
            }}
            className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-soft transition hover:text-accent"
          >
            <Plus className="size-3.5" /> Yeni adres
          </button>
        ) : null}
      </div>

      {form ? (
        <form onSubmit={kaydet} className="mb-4 grid gap-2 rounded-xl border border-line bg-background/40 p-3 sm:grid-cols-2">
          {alan("title", "Başlık (Ev, İş…)")}
          {alan("fullName", "Ad Soyad")}
          {alan("phone", "Telefon")}
          {alan("postalCode", "Posta kodu")}
          <div className="sm:col-span-2">{alan("address", "Adres", true)}</div>
          {alan("district", "İlçe")}
          {alan("city", "Şehir", true)}
          {alan("compName", "Firma (fatura için)")}
          {alan("taxNumber", "Vergi no")}
          {alan("taxOffice", "Vergi dairesi")}
          <div className="flex items-center gap-4 text-xs text-soft sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefaultShip ?? false}
                onChange={(e) => setForm((f) => (f ? { ...f, isDefaultShip: e.target.checked } : f))}
                className="accent-[var(--accent)]"
              />
              Varsayılan teslimat
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefaultBill ?? false}
                onChange={(e) => setForm((f) => (f ? { ...f, isDefaultBill: e.target.checked } : f))}
                className="accent-[var(--accent)]"
              />
              Varsayılan fatura
            </label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {duzenlenenUid ? "Güncelle" : "Ekle"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setForm(null);
                setDuzenlenenUid("");
              }}
              className="h-10 rounded-xl border border-line px-4 font-medium text-soft"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      {adresQ.isPending ? (
        <div className="h-16 animate-pulse rounded-xl bg-line/40" />
      ) : !adresQ.data?.length ? (
        <p className="text-sm text-soft">Kayıtlı adresiniz yok.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {adresQ.data.map((a) => (
            <li key={a.uid} className="relative rounded-xl border border-line p-3 text-sm">
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  title="Düzenle"
                  disabled={busy}
                  onClick={() => {
                    setDuzenlenenUid(a.uid);
                    setForm({ ...a });
                  }}
                  className="flex size-7 items-center justify-center rounded-lg text-soft transition hover:text-accent"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Sil"
                  disabled={busy}
                  onClick={() => void sil(a)}
                  className="flex size-7 items-center justify-center rounded-lg text-soft transition hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="pr-14 font-semibold">
                {a.title || "Adres"}
                {a.isDefaultShip ? <span className="ml-1 text-[10px] text-accent">· teslimat</span> : null}
                {a.isDefaultBill ? <span className="ml-1 text-[10px] text-accent">· fatura</span> : null}
              </p>
              <p className="text-soft">{a.fullName}</p>
              <p className="text-soft">{a.address}</p>
              <p className="text-soft">
                {a.district ? `${a.district}, ` : ""}
                {a.city}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * E-POSTA DOĞRULAMA DURUMU.
 *
 * Doğrulanmış hesapta yalnız küçük bir rozet; doğrulanmamışta bağlantıyı
 * yeniden isteme düğmesi. Doğrulama alışverişi ENGELLEMEZ — engelleseydi,
 * e-postası eline geçmeyen müşteri sipariş veremezdi ve bu, çözdüğünden çok
 * daha büyük bir sorun olurdu.
 */
function EpostaDurumu() {
  const token = useAuthStore((s) => s.token);
  const account = useAuthStore((s) => s.account);
  const [gonderildi, setGonderildi] = useState(false);
  const [islemde, setIslemde] = useState(false);

  if (!account) return null;
  if (account.emailVerified) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-success">
        <BadgeCheck className="size-4" /> E-posta doğrulandı
      </p>
    );
  }

  const gonder = async () => {
    setIslemde(true);
    try {
      await dogrulamaMailiGonder(token);
      setGonderildi(true);
      toast.success("Doğrulama bağlantısı e-postanıza gönderildi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Doğrulama e-postası gönderilemedi.");
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-background p-3">
      <span className="text-xs text-soft">E-posta adresiniz doğrulanmamış.</span>
      <button
        type="button"
        onClick={gonder}
        disabled={islemde || gonderildi}
        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium transition hover:bg-surface disabled:opacity-40"
      >
        {gonderildi ? "Gönderildi" : "Doğrulama bağlantısı gönder"}
      </button>
    </div>
  );
}

/**
 * ALARMLARIM — "gelince/düşünce haber ver" kayıtları.
 *
 * Haber verilmiş alarmlar da listede kalır: müşteri "bana haber verildi mi"
 * sorusunun cevabını burada görür. Referans fiyat GÖSTERİLMEZ — sunucuda ham
 * ölçekte tutulur (bkz. lib/api/alarm.ts).
 */
function AlarmlarBolumu() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["alarmlar"],
    queryFn: () => alarmlariGetir(token),
    enabled: !!token,
  });
  const sil = useMutation({
    mutationFn: (a: UrunAlarmi) => alarmSil(a.productUid, a.kind, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["alarmlar"] });
      toast.success("Alarm kaldırıldı.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Alarm kaldırılamadı."),
  });
  const alarmlar = data ?? [];

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <BellRing className="size-4.5 text-accent" /> Alarmlarım
      </h2>
      {isPending ? (
        <div className="h-16 animate-pulse rounded-xl bg-line/40" />
      ) : alarmlar.length === 0 ? (
        <p className="text-sm text-soft">
          Henüz alarmınız yok. Ürün sayfasındaki &ldquo;stoğa gelince&rdquo; ya da
          &ldquo;fiyat düşünce haber ver&rdquo; düğmesiyle kurabilirsiniz.
        </p>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {alarmlar.map((a) => (
            <li key={a.uid} className="flex items-center gap-3 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {a.kind === 1 ? (
                  <TrendingDown className="size-4" />
                ) : (
                  <BellRing className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/urun/${encodeURIComponent(a.handle || a.productUid)}`}
                  className="block truncate font-medium hover:text-accent"
                >
                  {a.name}
                </Link>
                <p className="text-xs text-soft">
                  {a.kind === 1 ? "Fiyat düşünce haber ver" : "Stoğa gelince haber ver"}
                  {a.notifiedAt ? ` · ${tarih(a.notifiedAt)} tarihinde haber verildi` : " · bekliyor"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Alarmı kaldır"
                disabled={sil.isPending}
                onClick={() => sil.mutate(a)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-soft transition hover:text-danger disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
