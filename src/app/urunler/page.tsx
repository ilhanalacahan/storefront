import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { kategorileriGetir, markalariGetir, urunSayfasiGetir } from "@/lib/api/catalog";

/**
 * Ürün listesi (PLP). SÜZGEÇ DURUMU URL'DEDİR
 * (?ara=…&kategori=…&marka=…&sirala=…&stokta=1&sayfa=…): link paylaşılabilir,
 * geri tuşu çalışır, sunucu aynı parametreyle SSR yapar. Arama kutusu
 * (header'da) 300 ms debounce ile bu adresi günceller.
 *
 * SAYFALAMA GERÇEK SAYIYA DAYANIR: backend toplam kayıt sayısını döndürür,
 * yani "3 / 12" gösterilebilir ve son sayfaya atlanabilir. Eski "+1 kayıt
 * iste, sonraki var mı bak" hilesi yalnız ileri/geri verebiliyordu.
 *
 * SIRALAMA VE FİYAT SÜZGECİ SUNUCUDA çözülür (fiyat önbelleğinden). İstemcide
 * sıralamak yalnız o sayfayı sıralar — "en ucuz" düğmesi, sayfa 2'deki daha
 * ucuz ürünü asla göstermezdi.
 */

const SAYFA_BOYU = 24;

/** Sıralama seçenekleri — anahtarlar backend sözleşmesiyle birebir. */
const SIRALAMALAR = [
  { deger: "", etiket: "Önerilen" },
  { deger: "fiyat-artan", etiket: "Artan fiyat" },
  { deger: "fiyat-azalan", etiket: "Azalan fiyat" },
  { deger: "yeni", etiket: "En yeni" },
] as const;

export const metadata: Metadata = { title: "Tüm Ürünler" };

interface Sorgu {
  ara?: string;
  kategori?: string;
  marka?: string;
  sirala?: string;
  stokta?: string;
  sayfa?: string;
}

export default async function Urunler({
  searchParams,
}: {
  searchParams: Promise<Sorgu>;
}) {
  const params = await searchParams;
  const ara = (params.ara ?? "").trim();
  const kategori = (params.kategori ?? "").trim();
  const marka = (params.marka ?? "").trim();
  const sirala = (params.sirala ?? "").trim();
  const stokta = params.stokta === "1";
  const sayfa = Math.max(1, Number(params.sayfa) || 1);

  let sonuc: Awaited<ReturnType<typeof urunSayfasiGetir>> = { urunler: [], toplam: 0 };
  let kategoriler: Awaited<ReturnType<typeof kategorileriGetir>> = [];
  let markalar: Awaited<ReturnType<typeof markalariGetir>> = [];
  let hata = "";
  try {
    // Üçü paralel: liste her istekte, kategori/marka facet'leri 5 dk ISR'lı.
    [sonuc, kategoriler, markalar] = await Promise.all([
      urunSayfasiGetir({
        search: ara,
        categoryUid: kategori,
        brand: marka,
        sort: sirala,
        inStock: stokta,
        limit: SAYFA_BOYU,
        offset: (sayfa - 1) * SAYFA_BOYU,
      }),
      kategorileriGetir().catch(() => []),
      markalariGetir({ search: ara, categoryUid: kategori }).catch(() => []),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const gorunen = sonuc.urunler;
  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / SAYFA_BOYU));
  const seciliKategori = kategoriler.find((k) => k.uid === kategori);

  /**
   * Adres kurucusu. Süzgeç değiştiğinde SAYFA 1'E DÖNER (açıkça sayfa
   * verilmedikçe): 7. sayfadayken kategori değiştiren müşteri, yeni kategorinin
   * 7. sayfasında boş bir listeye düşerdi.
   */
  interface LinkDegisikligi {
    ara?: string;
    kategori?: string;
    marka?: string;
    sirala?: string;
    /** "1" = yalnız stoktakiler, "" = süzgeci kaldır. */
    stokta?: string;
    sayfa?: number;
  }
  const linkYap = (d: LinkDegisikligi) => {
    const p = new URLSearchParams();
    const yaz = (ad: string, deger: string | undefined, mevcut: string) => {
      const v = deger !== undefined ? deger : mevcut;
      if (v) p.set(ad, v);
    };
    yaz("ara", d.ara, ara);
    yaz("kategori", d.kategori, kategori);
    yaz("marka", d.marka, marka);
    yaz("sirala", d.sirala, sirala);
    const stok = d.stokta !== undefined ? d.stokta === "1" : stokta;
    if (stok) p.set("stokta", "1");
    const n = d.sayfa ?? 1;
    if (n > 1) p.set("sayfa", String(n));
    const qs = p.toString();
    return qs ? `/urunler?${qs}` : "/urunler";
  };

  const cipSinifi = (aktif: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
      aktif
        ? "border-accent bg-accent text-accent-foreground"
        : "border-line bg-surface hover:border-soft"
    }`;

  return (
    <div className="space-y-5 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">
          {ara ? (
            <>&ldquo;{ara}&rdquo; için sonuçlar</>
          ) : seciliKategori ? (
            seciliKategori.name
          ) : (
            "Tüm Ürünler"
          )}{" "}
          <span className="text-base font-normal text-soft">({sonuc.toplam})</span>
        </h1>
        {sonSayfa > 1 ? (
          <p className="text-sm text-soft">
            Sayfa {sayfa} / {sonSayfa}
          </p>
        ) : null}
      </div>

      {/* Kategori ekseni */}
      {kategoriler.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link href={linkYap({ kategori: "" })} className={cipSinifi(!kategori)}>
            Tümü
          </Link>
          {kategoriler.map((k) => (
            <Link
              key={k.uid}
              href={linkYap({ kategori: k.uid === kategori ? "" : k.uid })}
              title={k.fullName}
              className={cipSinifi(k.uid === kategori)}
            >
              {k.name} <span className="opacity-60">({k.productCount})</span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Sıralama + marka + stok ekseni */}
      <div className="flex flex-wrap items-center gap-2 border-y border-line py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-soft">Sırala</span>
        {SIRALAMALAR.map((s) => (
          <Link
            key={s.deger}
            href={linkYap({ sirala: s.deger })}
            className={`rounded-lg px-2.5 py-1 text-sm transition ${
              sirala === s.deger
                ? "bg-accent/10 font-semibold text-accent"
                : "text-soft hover:text-foreground"
            }`}
          >
            {s.etiket}
          </Link>
        ))}

        <span className="mx-1 h-4 w-px bg-line" />

        <Link
          href={linkYap({ stokta: stokta ? "" : "1" })}
          className={`rounded-lg px-2.5 py-1 text-sm transition ${
            stokta
              ? "bg-accent/10 font-semibold text-accent"
              : "text-soft hover:text-foreground"
          }`}
        >
          Yalnız stoktakiler
        </Link>

        {markalar.length > 0 ? (
          <>
            <span className="mx-1 h-4 w-px bg-line" />
            <span className="text-xs font-semibold uppercase tracking-wide text-soft">Marka</span>
            <div className="flex flex-wrap gap-1.5">
              {markalar.slice(0, 12).map((m) => (
                <Link
                  key={m.name}
                  href={linkYap({ marka: m.name === marka ? "" : m.name })}
                  className={`rounded-lg px-2.5 py-1 text-sm transition ${
                    m.name === marka
                      ? "bg-accent/10 font-semibold text-accent"
                      : "text-soft hover:text-foreground"
                  }`}
                >
                  {m.name} <span className="opacity-60">({m.count})</span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {hata ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-soft">
          {hata}
        </div>
      ) : gorunen.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-12 text-center">
          <PackageSearch className="size-10 text-soft/50" />
          <p className="font-medium">Sonuç bulunamadı</p>
          <p className="text-sm text-soft">
            {ara || marka || stokta
              ? "Süzgeçleri gevşetin ya da tüm ürünlere göz atın."
              : "Bu kanalda henüz yayında ürün yok."}
          </p>
          {ara || marka || stokta || kategori ? (
            <Link href="/urunler" className="text-sm font-medium text-accent hover:underline">
              Tüm ürünleri göster
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gorunen.map((u) => (
              <ProductCard key={u.uid} urun={u} />
            ))}
          </div>

          {sonSayfa > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Sayfalama">
              {sayfa > 1 ? (
                <Link
                  href={linkYap({ sayfa: sayfa - 1 })}
                  className="flex h-10 items-center gap-1 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition hover:border-accent"
                >
                  <ChevronLeft className="size-4" /> Önceki
                </Link>
              ) : null}
              <span className="px-2 text-sm text-soft">
                {sayfa} / {sonSayfa}
              </span>
              {sayfa < sonSayfa ? (
                <Link
                  href={linkYap({ sayfa: sayfa + 1 })}
                  className="flex h-10 items-center gap-1 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition hover:border-accent"
                >
                  Sonraki <ChevronRight className="size-4" />
                </Link>
              ) : null}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
