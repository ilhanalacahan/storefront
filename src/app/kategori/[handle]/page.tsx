import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { KirintiYapisalVerisi } from "@/components/json-ld";
import {
  KatalogBos,
  KatalogHata,
  KatalogSuzgecCubugu,
  NitelikSuzgeci,
  SAYFA_BOYU,
  Sayfalama,
  UrunIzgarasi,
  katalogLinkKurucu,
  katalogSorgusuCoz,
  suzgecVarMi,
  type HamKatalogSorgusu,
} from "@/components/katalog-listesi";
import { Kirinti, type KirintiOgesi } from "@/components/kirinti";
import {
  kategoriGetir,
  markalariGetir,
  nitelikleriGetir,
  urunSayfasiGetir,
} from "@/lib/api/catalog";
import { kategoriYolu } from "@/lib/kategori";

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
  let hata = "";
  try {
    [sonuc, markalar, nitelikler] = await Promise.all([
      urunSayfasiGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
        sort: sorgu.sirala,
        inStock: sorgu.stokta,
        attributes: sorgu.nitelikler,
        limit: SAYFA_BOYU,
        offset: (sorgu.sayfa - 1) * SAYFA_BOYU,
      }),
      markalariGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        attributes: sorgu.nitelikler,
      }).catch(() => []),
      nitelikleriGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
      }).catch(() => []),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const yol = kategoriYolu(kategori);
  const linkYap = katalogLinkKurucu(yol, sorgu);
  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / SAYFA_BOYU));
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
          {sonSayfa > 1 ? (
            <p className="text-sm text-soft">
              Sayfa {sorgu.sayfa} / {sonSayfa}
            </p>
          ) : null}
        </div>
        {kategori.description ? (
          <p className="max-w-2xl text-sm text-soft">{kategori.description}</p>
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

      <KatalogSuzgecCubugu sorgu={sorgu} markalar={markalar} linkYap={linkYap} />
      <NitelikSuzgeci facetler={nitelikler} sorgu={sorgu} linkYap={linkYap} />

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
          <UrunIzgarasi urunler={sonuc.urunler} />
          <Sayfalama sayfa={sorgu.sayfa} sonSayfa={sonSayfa} linkYap={linkYap} />
        </>
      )}
    </div>
  );
}
