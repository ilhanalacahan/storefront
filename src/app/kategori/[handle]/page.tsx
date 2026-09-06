import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { KirintiYapisalVerisi } from "@/components/json-ld";
import { KatalogDuzeni } from "@/components/katalog-duzeni";
import {
  AktifSuzgecler,
  FacetPaneli,
  GorunumSecici,
  KatalogBos,
  KatalogHata,
  Sayfalama,
  SiralamaSecici,
  UrunIzgarasi,
  katalogLinkKurucu,
  katalogSorgusuCoz,
  suzgecVarMi,
  type HamKatalogSorgusu,
} from "@/components/katalog-listesi";
import { Kirinti, type KirintiOgesi } from "@/components/kirinti";
import {
  kategoriGetir,
  makineleriGetir,
  markalariGetir,
  nitelikleriGetir,
  urunSayfasiGetir,
} from "@/lib/api/catalog";
import { MakineSecici } from "@/components/makine-secici";
import { kategoriYolu } from "@/lib/kategori";
import { Markdown } from "@/lib/markdown";

/**
 * Kategori sayfası (/kategori/[handle]) — kırıntı yolu kategorinin ata
 * zincirinden, alt kategori çipleri çocuklarından, liste ALT AĞACIN
 * TAMAMINDAN gelir (backend kategori süzgecini ltree ile çözer: "Elektronik"
 * sayfası "Telefon"un ürünlerini de gösterir).
 *
 * Süzgeç/sıralama/sayfalama /urunler ile aynı bileşenlerdir; durum URL'dedir.
 */

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<HamKatalogSorgusu>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const kategori = await kategoriGetir(handle);
  if (!kategori) return { title: "Kategori" };
  const yol = kategoriYolu(kategori);
  // SEO meta'sı kategori kartında yazılmışsa o, yoksa ad/açıklamadan türetilir.
  const baslik = kategori.metaTitle || kategori.name;
  const aciklama =
    kategori.metaDescription ||
    kategori.description ||
    `${kategori.fullName} — ${kategori.productCount} ürün`;
  return {
    title: baslik,
    description: aciklama,
    // Handle'lı ve uid'li adres aynı sayfadır; asıl olan handle'lıdır.
    alternates: { canonical: yol },
    openGraph: {
      title: baslik,
      description: aciklama,
      url: yol,
      images: kategori.imageUrl ? [{ url: kategori.imageUrl, alt: kategori.name }] : undefined,
    },
  };
}

export default async function KategoriSayfasi({ params, searchParams }: Props) {
  const [{ handle }, ham] = await Promise.all([params, searchParams]);
  const sorgu = katalogSorgusuCoz(ham);

  const kategori = await kategoriGetir(handle);
  if (!kategori) notFound();

  let sonuc: Awaited<ReturnType<typeof urunSayfasiGetir>> = { urunler: [], toplam: 0 };
  let markalar: Awaited<ReturnType<typeof markalariGetir>> = [];
  let nitelikler: Awaited<ReturnType<typeof nitelikleriGetir>> = [];
  let makineler: Awaited<ReturnType<typeof makineleriGetir>> = [];
  let hata = "";
  try {
    [sonuc, markalar, nitelikler, makineler] = await Promise.all([
      urunSayfasiGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
        sort: sorgu.sirala,
        inStock: sorgu.stokta,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
        limit: sorgu.boyut,
        offset: (sorgu.sayfa - 1) * sorgu.boyut,
      }),
      markalariGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
      }).catch(() => []),
      // BAĞIMLI facet: seçili nitelikler gönderilir, eksenler birbirini daraltır.
      nitelikleriGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
      }).catch(() => []),
      // "Makine seç → ürün bul": kategorinin alt ağacındaki makine tablosu.
      makineleriGetir(kategori.uid),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const yol = kategoriYolu(kategori);
  const linkYap = katalogLinkKurucu(yol, sorgu);
  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / sorgu.boyut));
  const suzgecVar = suzgecVarMi(sorgu);

  const kirinti: KirintiOgesi[] = [
    ...kategori.ancestors.map((a) => ({ ad: a.name, href: kategoriYolu(a) })),
    { ad: kategori.name },
  ];

  return (
    <div className="space-y-5 py-6">
      <KirintiYapisalVerisi ogeler={kirinti} url={yol} />
      <div className="space-y-2">
        <Kirinti ogeler={kirinti} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">
            {sorgu.ara ? (
              <>
                {kategori.name} içinde &ldquo;{sorgu.ara}&rdquo;
              </>
            ) : (
              kategori.name
            )}{" "}
            <span className="text-base font-normal text-soft">({sonuc.toplam})</span>
          </h1>
          <div className="flex items-center gap-3">
          <SiralamaSecici sorgu={sorgu} linkYap={linkYap} />
          <GorunumSecici sorgu={sorgu} linkYap={linkYap} />
        </div>
        </div>
        {kategori.description ? (
          <Markdown metin={kategori.description} className="max-w-2xl" />
        ) : null}
      </div>

      {kategori.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- harici görsel; boyut bilinmiyor
        <img
          src={kategori.imageUrl}
          alt={kategori.name}
          className="aspect-[4/1] w-full rounded-2xl border border-line object-cover"
        />
      ) : null}

      {/* Alt kategoriler — yalnız ürünü olanlar gelir; boşsa çubuk çizilmez. */}
      {kategori.children.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {kategori.children.map((c) => (
            <Link
              key={c.uid}
              href={kategoriYolu(c)}
              className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium transition hover:border-accent hover:text-accent"
            >
              {c.name} <span className="opacity-60">({c.productCount})</span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Makine seçimi kategori süzgecine çevrilir (n.<anahtar>=<değer>); eşleşen
          kartları bağımlı facet ve liste bulur — makine ürüne bağlı değildir. */}
      <MakineSecici makineler={makineler} kategoriYolu={yol} secili={sorgu.nitelikler} />

      <Suspense>
        <KatalogDuzeni
          panel={
            <FacetPaneli
              sorgu={sorgu}
              markalar={markalar}
              facetler={nitelikler}
              linkYap={linkYap}
              kategoriler={kategori.children}
              kategoriBasligi="Alt Kategoriler"
            />
          }
        >
          <AktifSuzgecler
            sorgu={sorgu}
            linkYap={linkYap}
            temizleHref={yol}
            facetler={nitelikler}
          />

          {hata ? (
            <KatalogHata mesaj={hata} />
          ) : sonuc.urunler.length === 0 ? (
            <KatalogBos
              baslik={suzgecVar ? "Sonuç bulunamadı" : "Bu kategoride yayında ürün yok"}
              suzgecVar={suzgecVar}
              temizleHref={suzgecVar ? yol : "/urunler"}
            />
          ) : (
            <>
              <UrunIzgarasi urunler={sonuc.urunler} gorunum={sorgu.gorunum} />
              <Sayfalama sayfa={sorgu.sayfa} sonSayfa={sonSayfa} linkYap={linkYap} />
            </>
          )}
        </KatalogDuzeni>
      </Suspense>
    </div>
  );
}
