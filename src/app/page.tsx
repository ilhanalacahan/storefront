import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

import { KategoriSerit } from "@/components/kategori-serit";
import { MarkaSerit } from "@/components/marka-serit";
import { ProductCard } from "@/components/product-card";
import { SekmeliVitrin, type VitrinSekmesi } from "@/components/sekmeli-vitrin";
import { Serit } from "@/components/serit";
import { SonGezilenler } from "@/components/son-gezilenler";
import {
  kategorileriGetir,
  koleksiyonlariGetir,
  markalariGetir,
  urunleriGetir,
  type StorefrontCollection,
} from "@/lib/api/catalog";
import type { StorefrontProduct } from "@/lib/api/types";

/** Ana sayfada bir şeritte gösterilecek azami ürün. */
const SERIT_BOYU = 10;
/** Ana sayfaya alınacak azami koleksiyon şeridi (sayfa sonsuza uzamasın). */
const KOLEKSIYON_SERIDI = 3;

/**
 * ANA SAYFA — ticari vitrin düzeni.
 *
 * TAMAMI SERVER COMPONENT'TIR ve tek turda paralel çekilir: hero, kategori,
 * marka, koleksiyon ve ürün blokları. Sekmeli vitrinin sekmeleri bile
 * sunucuda çizilip prop olarak iner — SEO botu her sekmenin içeriğini görür
 * ve tarayıcı açılışta tek bir istek bile atmaz.
 *
 * HER BLOK KENDİNİ GİZLEYEBİLİR: koleksiyonu olmayan mağazada koleksiyon
 * şeridi, markası olmayan katalogda marka şeridi hiç çizilmez. Boş başlıklar
 * mağazayı kurulmamış gösterir.
 *
 * BİR BLOĞUN HATASI SAYFAYI DÜŞÜRMEZ: her çağrı kendi catch'iyle boşa düşer.
 * Katalog ucu kapalıyken de sayfa açılır, hata sayfası değil.
 */
export default async function AnaSayfa() {
  const [urunSonucu, yeniler, kategoriler, markalar, koleksiyonlar] = await Promise.all([
    urunleriGetir({ limit: SERIT_BOYU }).then(
      (u) => ({ u, e: "" }),
      (e: unknown) => ({ u: [] as StorefrontProduct[], e: e instanceof Error ? e.message : "Katalog yüklenemedi." }),
    ),
    urunleriGetir({ limit: SERIT_BOYU, sort: "yeni" }).catch(() => [] as StorefrontProduct[]),
    kategorileriGetir().catch(() => []),
    markalariGetir().catch(() => []),
    koleksiyonlariGetir().catch(() => [] as StorefrontCollection[]),
  ]);
  const urunler = urunSonucu.u;
  const hata = urunSonucu.e;

  // Koleksiyon şeritleri: ana sayfaya alınan ilk birkaç koleksiyonun ürünleri
  // tek turda paralel çekilir (koleksiyon başına sıralı istek, sayfayı
  // koleksiyon sayısı kadar yavaşlatırdı).
  const seritKoleksiyonlari = koleksiyonlar.slice(0, KOLEKSIYON_SERIDI);
  const koleksiyonUrunleri = await Promise.all(
    seritKoleksiyonlari.map((k) =>
      urunleriGetir({ collectionUid: k.uid, limit: SERIT_BOYU }).catch(() => [] as StorefrontProduct[]),
    ),
  );

  const sekmeler: VitrinSekmesi[] = [];
  if (urunler.length) {
    sekmeler.push({
      anahtar: "one-cikan",
      etiket: "Öne Çıkanlar",
      href: "/urunler",
      icerik: <Izgara urunler={urunler} />,
    });
  }
  if (yeniler.length) {
    sekmeler.push({
      anahtar: "yeni",
      etiket: "Yeni Gelenler",
      href: "/urunler?sirala=yeni",
      icerik: <Izgara urunler={yeniler} />,
    });
  }
  const indirimliler = urunler.filter((u) => u.compareAtPrice);
  if (indirimliler.length >= 2) {
    sekmeler.push({
      anahtar: "firsat",
      etiket: "Fırsatlar",
      href: "/urunler",
      icerik: <Izgara urunler={indirimliler} />,
    });
  }

  return (
    <div className="space-y-10 py-5">
      <VarsayilanHero />

      {/* GÜVEN ŞERİDİ */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          { Icon: Truck, baslik: "Hızlı Teslimat", alt: "Stoktan aynı gün kargo" },
          { Icon: ShieldCheck, baslik: "Güvenli Ödeme", alt: "3D Secure altyapısı" },
          { Icon: RotateCcw, baslik: "Kolay İade", alt: "14 gün koşulsuz" },
        ].map(({ Icon, baslik, alt }) => (
          <div
            key={baslik}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{baslik}</p>
              <p className="truncate text-xs text-soft">{alt}</p>
            </div>
          </div>
        ))}
      </section>

      <KategoriSerit kategoriler={kategoriler} />

      {hata ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-soft">
          <p className="font-medium text-foreground">Katalog şu an yüklenemiyor</p>
          <p className="mt-1">{hata}</p>
          <p className="mt-3 text-xs">
            TicariCore backend&apos;inin çalıştığından ve .env.local&apos;daki publishable key&apos;in
            doğru olduğundan emin olun.
          </p>
        </div>
      ) : sekmeler.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-soft">
          Bu kanalda yayında ürün yok — ticari yönetim uygulamasından ürünleri kanala yayınlayın
          (yayın politikası ya da kanal ilanı).
        </div>
      ) : (
        <SekmeliVitrin sekmeler={sekmeler} />
      )}

      {seritKoleksiyonlari.map((k, i) =>
        koleksiyonUrunleri[i]?.length ? (
          <Serit
            key={k.uid}
            baslik={k.name}
            altBaslik={k.description || undefined}
            tumuHref={`/koleksiyon/${encodeURIComponent(k.handle || k.uid)}`}
          >
            {koleksiyonUrunleri[i].map((u) => (
              <div key={u.uid} className="w-44 sm:w-52">
                <ProductCard urun={u} />
              </div>
            ))}
          </Serit>
        ) : null,
      )}

      <MarkaSerit markalar={markalar} />
      <SonGezilenler />
    </div>
  );
}

/** Dört sütunlu ürün ızgarası — sekmelerin ortak yerleşimi. */
function Izgara({ urunler }: { urunler: StorefrontProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {urunler.map((u) => (
        <ProductCard key={u.uid} urun={u} />
      ))}
    </div>
  );
}

/** Ana sayfanın üst bloğu. */
function VarsayilanHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent to-indigo-700 px-6 py-14 text-white md:px-12 md:py-20">
      <div className="relative z-10 max-w-xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
          Yeni sezon teknoloji
        </p>
        <h1 className="text-3xl font-bold leading-tight md:text-5xl">
          Aradığın elektronik,
          <br />
          stoktan kapına.
        </h1>
        <p className="text-white/80">
          Fiyatlar ve stoklar doğrudan mağazamızın ERP sisteminden — gördüğün her ürün gerçekten
          rafta.
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
