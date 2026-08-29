"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, Loader2, RotateCcw, ShieldQuestion, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { odemeOturumu } from "@/lib/api/payment";
import type { PaymentSession } from "@/lib/api/types";
import { fiyat } from "@/lib/format";
import { odemeIziniSil, sonOturumUid } from "@/lib/odeme-izi";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

/** Sonuç henüz kesinleşmemiş durumlar — yoklamaya devam edilir. */
const BEKLEYEN = new Set([0, 1]); // created · pending

/**
 * Yoklama üst sınırı. Webhook gecikirse sonsuza kadar dönmemek için: 3 sn'de
 * bir, en çok 40 deneme ≈ 2 dakika. Sonrasında "sonuç henüz belli değil"
 * denir — "başarısız" DENMEZ, çünkü ödeme arka planda tamamlanmış olabilir ve
 * müşteriye yanlış haber vermek, haber vermemekten kötüdür.
 */
const AZAMI_DENEME = 40;

export function OdemeDonusu() {
  const params = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const clearCart = useCartStore((s) => s.clearCart);

  // Oturumu ÖNCE adres söyler (sağlayıcı parametre ekleyebiliyorsa), sonra
  // ödeme izi. Sağlayıcıların bir kısmı dönüş adresine kendi parametrelerini
  // ekler, bir kısmı adresi olduğu gibi çağırır; ikisi de desteklenir.
  const oturumUID = params.get("oturum") || params.get("session") || sonOturumUid();

  const { data, isPending, failureCount, refetch, isRefetching } = useQuery<PaymentSession | null>({
    queryKey: ["odeme-oturumu", oturumUID],
    queryFn: () => odemeOturumu(oturumUID, token || null),
    enabled: !!oturumUID,
    staleTime: 0,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d || !BEKLEYEN.has(d.status)) return false;
      return q.state.dataUpdateCount >= AZAMI_DENEME ? false : 3_000;
    },
  });

  // Sipariş doğduysa sepet kapanmıştır: yerel sepet kimliğini ve ödeme izini
  // temizle. Bayat clientUid bir sonraki alışverişte "bu ödeme isteği zaten
  // işlendi" hatası üretirdi.
  useEffect(() => {
    if (data?.status === 3) {
      odemeIziniSil(data.cartUid);
      clearCart();
    }
  }, [data?.status, data?.cartUid, clearCart]);

  if (!oturumUID) {
    return (
      <Kart
        ikon={<ShieldQuestion className="size-9" />}
        ton="notr"
        baslik="Ödeme kaydı bulunamadı"
        aciklama="Bu sayfa bir ödeme dönüşünü gösterir. Ödemenizi tamamladıysanız siparişinizi hesabınızdan görebilirsiniz."
      >
        <Baglantilar />
      </Kart>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-soft">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">Ödeme sonucu alınıyor…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Kart
        ikon={<ShieldQuestion className="size-9" />}
        ton="notr"
        baslik="Ödeme kaydına ulaşılamadı"
        aciklama={
          failureCount > 0
            ? "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edip tekrar deneyin — ödemeniz alındıysa siparişiniz hesabınızda görünür."
            : "Bu ödeme oturumu size ait değil ya da süresi dolmuş."
        }
      >
        <Baglantilar />
      </Kart>
    );
  }

  // === TAHSİL EDİLDİ — sipariş doğdu ===
  if (data.status === 3 || data.status === 4 || data.status === 5) {
    return (
      <Kart
        ikon={<BadgeCheck className="size-9" />}
        ton="basari"
        baslik="Siparişiniz alındı 🎉"
        aciklama="Ödemeniz onaylandı, siparişiniz oluşturuldu ve stok sizin için rezerve edildi."
      >
        <dl className="w-full space-y-1.5 rounded-2xl border border-line bg-surface p-4 text-left text-sm">
          <Satir ad="Tutar" deger={fiyat(data.capturedAmount, data.curCode)} />
          {data.orderUid ? <Satir ad="Sipariş No" deger={data.orderUid} mono /> : null}
          {data.status !== 3 ? <Satir ad="Durum" deger={data.statusLabel} /> : null}
        </dl>
        <Baglantilar siparisVar={!!data.orderUid} />
        {!token ? (
          <p className="text-xs text-soft">
            İpucu: üye olursanız siparişlerinizi hesabınızdan takip edebilirsiniz.
          </p>
        ) : null}
      </Kart>
    );
  }

  // === YETKİLENDİRİLDİ ama tahsil edilmedi ===
  if (data.status === 2) {
    return (
      <Kart
        ikon={<Clock className="size-9" />}
        ton="notr"
        baslik="Ödemeniz yetkilendirildi"
        aciklama="Tutar kartınızda bloke edildi; tahsilat mağaza onayıyla tamamlanacak. Sipariş tahsilat anında oluşur ve size bildirilir."
      >
        <Baglantilar />
      </Kart>
    );
  }

  // === BAŞARISIZ / İPTAL ===
  if (data.status === 6 || data.status === 7) {
    const iptal = data.status === 7;
    return (
      <Kart
        ikon={<XCircle className="size-9" />}
        ton="hata"
        baslik={iptal ? "Ödeme iptal edildi" : "Ödeme tamamlanamadı"}
        aciklama={
          data.errorMessage ||
          (iptal
            ? "Sepetiniz duruyor; dilediğinizde ödemeyi yeniden başlatabilirsiniz."
            : "Bankanız işlemi tamamlamadı. Sepetiniz duruyor — tekrar deneyebilirsiniz.")
        }
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/odeme"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            Ödemeyi Tekrar Dene
          </Link>
          <Link
            href="/sepet"
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:bg-surface"
          >
            Sepete Dön
          </Link>
        </div>
      </Kart>
    );
  }

  // === HÂLÂ BEKLİYOR ===
  return (
    <Kart
      ikon={<Loader2 className="size-9 animate-spin" />}
      ton="notr"
      baslik="Ödemeniz doğrulanıyor"
      aciklama="Bankanızdan sonuç bekleniyor. Bu sayfayı kapatmayın — sonuç geldiğinde otomatik güncellenecek."
    >
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isRefetching}
        className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold transition hover:bg-surface disabled:opacity-40"
      >
        <RotateCcw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
        Durumu Yenile
      </button>
      <p className="text-xs text-soft">
        Tarayıcıyı kapatsanız da ödeme arka planda sonuçlanır; siparişiniz oluşursa
        hesabınızda görünür.
      </p>
    </Kart>
  );
}

// ---------------------------------------------------------------------------

const TONLAR = {
  basari: "bg-success/10 text-success",
  hata: "bg-danger/10 text-danger",
  notr: "bg-accent/10 text-accent",
} as const;

function Kart({
  ikon,
  ton,
  baslik,
  aciklama,
  children,
}: {
  ikon: React.ReactNode;
  ton: keyof typeof TONLAR;
  baslik: string;
  aciklama: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-20 text-center">
      <span className={`flex size-16 items-center justify-center rounded-full ${TONLAR[ton]}`}>
        {ikon}
      </span>
      <h1 className="text-2xl font-bold">{baslik}</h1>
      <p className="text-sm text-soft">{aciklama}</p>
      {children}
    </div>
  );
}

function Satir({ ad, deger, mono = false }: { ad: string; deger: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-soft">{ad}</dt>
      <dd className={mono ? "font-mono text-xs" : "font-semibold"}>{deger}</dd>
    </div>
  );
}

function Baglantilar({ siparisVar = false }: { siparisVar?: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link
        href="/urunler"
        className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:bg-surface"
      >
        Alışverişe Devam
      </Link>
      <Link
        href="/hesap"
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
      >
        {siparisVar ? "Siparişlerim" : "Hesabım"}
      </Link>
    </div>
  );
}
