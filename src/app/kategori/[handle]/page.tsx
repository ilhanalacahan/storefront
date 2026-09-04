import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { KirintiYapisalVerisi } from "@/components/json-ld";
import {
  KatalogBos,
  KatalogHata,
  KatalogSuzgecCubugu,
  SAYFA_BOYU,
  Sayfalama,
  UrunIzgarasi,
  katalogLinkKurucu,
  katalogSorgusuCoz,
  type HamKatalogSorgusu,
} from "@/components/katalog-listesi";
import { Kirinti, type KirintiOgesi } from "@/components/kirinti";
import { kategoriGetir, markalariGetir, urunSayfasiGetir } from "@/lib/api/catalog";
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
  return {
    title: kategori.name,
    description: `${kategori.fullName} — ${kategori.productCount} ürün`,
    // Handle'lı ve uid'li adres aynı sayfadır; asıl olan handle'lıdır.
    alternates: { canonical: yol },
    openGraph: { title: kategori.name, url: yol },
  };
}

export default async function KategoriSayfasi({ params, searchParams }: Props) {
  const [{ handle }, ham] = await Promise.all([params, searchParams]);
  const sorgu = katalogSorgusuCoz(ham);

  const kategori = await kategoriGetir(handle);
  if (!kategori) notFound();

  let sonuc: Awaited<ReturnType<typeof urunSayfasiGetir>> = { urunler: [], toplam: 0 };
  let markalar: Awaited<ReturnType<typeof markalariGetir>> = [];
  let hata = "";
  try {
    [sonuc, markalar] = await Promise.all([
      urunSayfasiGetir({
        categoryUid: kategori.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
        sort: sorgu.sirala,
        inStock: sorgu.stokta,
        limit: SAYFA_BOYU,
        offset: (sorgu.sayfa - 1) * SAYFA_BOYU,
      }),
      markalariGetir({ categoryUid: kategori.uid, search: sorgu.ara }).catch(() => []),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const yol = kategoriYolu(kategori);
  const linkYap = katalogLinkKurucu(yol, sorgu);
  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / SAYFA_BOYU));
  const suzgecVar = Boolean(sorgu.ara || sorgu.marka || sorgu.stokta);

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
      </div>

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
