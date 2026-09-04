"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ChevronDown, Heart, Loader2, LogOut, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  adreslerim,
  dogrulamaMailiGonder,
  girisYap,
  kayitOl,
  siparisDetay,
  siparislerim,
} from "@/lib/api/account";
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
  return token ? <HesapPaneli /> : <GirisKayit />;
}

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

function HesapPaneli() {
  const token = useAuthStore((s) => s.token);
  const account = useAuthStore((s) => s.account);
  const signOut = useAuthStore((s) => s.signOut);
  const clearCart = useCartStore((s) => s.clearCart);

  const siparisQ = useQuery({
    queryKey: ["siparisler"],
    queryFn: () => siparislerim(token),
  });

  const cikis = () => {
    signOut();
    clearCart(); // hesaba bağlı sepet misafir uid'iyle zaten açılamaz
    toast.info("Çıkış yapıldı.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
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

      <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
        <p className="font-semibold">{account?.fullName || "—"}</p>
        <p className="text-soft">{account?.email}</p>
        {account?.phone ? <p className="text-soft">{account.phone}</p> : null}
        <EpostaDurumu />
      </section>

      <Link
        href="/favoriler"
        className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 text-sm transition hover:border-accent"
      >
        <span className="flex items-center gap-2 font-semibold">
          <Heart className="size-4.5 text-danger" /> Favorilerim
        </span>
        <ChevronDown className="size-4 -rotate-90 text-soft" />
      </Link>

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

      <AdreslerBolumu />
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
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

function AdreslerBolumu() {
  const token = useAuthStore((s) => s.token);
  const adresQ = useQuery({
    queryKey: ["adresler"],
    queryFn: () => adreslerim(token),
  });

  return (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <MapPin className="size-4.5 text-accent" /> Adreslerim
        </h2>
        {adresQ.isPending ? (
          <div className="h-16 animate-pulse rounded-xl bg-line/40" />
        ) : !adresQ.data?.length ? (
          <p className="text-sm text-soft">Kayıtlı adresiniz yok.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {adresQ.data.map((a) => (
              <li key={a.uid} className="rounded-xl border border-line p-3 text-sm">
                <p className="font-semibold">{a.title || "Adres"}</p>
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
