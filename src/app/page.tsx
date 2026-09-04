import { ArrowRight, CreditCard, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { urunleriGetir } from "@/lib/api/catalog";
import { bannerlariGetir, type StorefrontBanner } from "@/lib/api/cms";

/**
 * Ana sayfa — hero + banner kartları + vitrin. Server Component: katalog 60 sn
 * ISR ile gelir, her ziyaretçi ERP'yi yormaz. Hero ve banner'lar CMS'den
 * (TicariApp → Ayarlar → Vitrin Banner'ları); hiç hero yoksa şablonun
 * varsayılan hero'su çizilir.
 */
export default async function AnaSayfa() {
  let urunler: Awaited<ReturnType<typeof urunleriGetir>> = [];
  let hata = "";
  const [urunSonucu, bannerlar] = await Promise.all([
    urunleriGetir({ limit: 8 }).then(
      (u) => ({ u, e: "" }),
      (e: unknown) => ({ u: [], e: e instanceof Error ? e.message : "Katalog yüklenemedi." }),
    ),
    bannerlariGetir().catch(() => [] as StorefrontBanner[]),
  ]);
  urunler = urunSonucu.u;
  hata = urunSonucu.e;
  const herolar = bannerlar.filter((b) => b.kind === 1);
  const kartlar = bannerlar.filter((b) => b.kind === 2);

  return (
    <div className="space-y-12 py-6">
      {herolar.length ? <Hero banner={herolar[0]} /> : <VarsayilanHero />}

      {/* GÜVEN ŞERİDİ */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { Icon: Truck, baslik: "Hızlı Teslimat", alt: "Stoktan aynı gün kargo" },
          { Icon: ShieldCheck, baslik: "Güvenli Ödeme", alt: "3D Secure altyapısı" },
          { Icon: RotateCcw, baslik: "Kolay İade", alt: "14 gün koşulsuz" },
          { Icon: CreditCard, baslik: "Taksit İmkânı", alt: "Tüm kartlara taksit" },
        ].map(({ Icon, baslik, alt }) => (
          <div
            key={baslik}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{baslik}</p>
              <p className="text-xs text-soft">{alt}</p>
            </div>
          </div>
        ))}
      </section>

      {kartlar.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kartlar.map((k) => (
            <BannerKarti key={k.uid} banner={k} />
          ))}
        </section>
      ) : null}

      {/* VİTRİN */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Öne Çıkanlar</h2>
          <Link
            href="/urunler"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Tümünü Gör <ArrowRight className="size-4" />
          </Link>
        </div>
        {hata ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-soft">
            <p className="font-medium text-foreground">Katalog şu an yüklenemiyor</p>
            <p className="mt-1">{hata}</p>
            <p className="mt-3 text-xs">
              TicariCore backend'inin çalıştığından ve .env.local'daki publishable
              key'in doğru olduğundan emin olun.
            </p>
          </div>
        ) : urunler.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-soft">
            Bu kanalda yayında ürün yok — ticari yönetim uygulamasından ürünleri kanala yayınlayın
            (yayın politikası ya da kanal ilanı).
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {urunler.map((u) => (
              <ProductCard key={u.uid} urun={u} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** CMS hero'su — görsel varsa sağda, yoksa gradyan zemin. */
function Hero({ banner }: { banner: StorefrontBanner }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent to-indigo-700 text-white">
      <div className="grid items-center gap-6 px-6 py-14 md:grid-cols-2 md:px-12 md:py-20">
        <div className="relative z-10 max-w-xl space-y-4">
          {banner.subtitle ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70">{banner.subtitle}</p>
          ) : null}
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">{banner.title}</h1>
          {banner.body ? <p className="whitespace-pre-line text-white/80">{banner.body}</p> : null}
          {banner.linkUrl ? (
            <Link
              href={banner.linkUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-accent transition hover:bg-white/90"
            >
              {banner.linkLabel || "Keşfet"} <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
        {banner.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- CMS görseli; boyut bilinmiyor
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="relative z-10 max-h-80 w-full rounded-2xl object-cover shadow-2xl shadow-black/30"
          />
        ) : null}
      </div>
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-24 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
    </section>
  );
}

/** Şablonun varsayılan hero'su — CMS'de hero tanımlanana kadar. */
function VarsayilanHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent to-indigo-700 px-6 py-14 text-white md:px-12 md:py-20">
      <div className="relative z-10 max-w-xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Yeni sezon teknoloji</p>
        <h1 className="text-3xl font-bold leading-tight md:text-5xl">
          Aradığın elektronik,
          <br />
          stoktan kapına.
        </h1>
        <p className="text-white/80">
          Fiyatlar ve stoklar doğrudan mağazamızın ERP sisteminden — gördüğün her ürün gerçekten rafta.
        </p>
        <Link
          href="/urunler"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-accent transition hover:bg-white/90"
        >
          Alışverişe Başla <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-24 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
    </section>
  );
}

/** Banner kartı — görsel + başlık + isteğe bağlı bağlantı. */
function BannerKarti({ banner }: { banner: StorefrontBanner }) {
  const icerik = (
    <>
      {banner.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- CMS görseli; boyut bilinmiyor
        <img src={banner.imageUrl} alt={banner.title} className="aspect-[3/1] w-full object-cover transition group-hover:scale-[1.02]" />
      ) : (
        <div className="aspect-[3/1] w-full bg-gradient-to-br from-accent/20 to-accent/5" />
      )}
      <div className="space-y-1 p-4">
        <p className="font-semibold">{banner.title}</p>
        {banner.subtitle ? <p className="text-sm text-soft">{banner.subtitle}</p> : null}
        {banner.linkLabel ? (
          <p className="flex items-center gap-1 text-sm font-medium text-accent">
            {banner.linkLabel} <ArrowRight className="size-4" />
          </p>
        ) : null}
      </div>
    </>
  );
  const sinif = "group overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent";
  return banner.linkUrl ? (
    <Link href={banner.linkUrl} className={sinif}>
      {icerik}
    </Link>
  ) : (
    <div className={sinif}>{icerik}</div>
  );
}
