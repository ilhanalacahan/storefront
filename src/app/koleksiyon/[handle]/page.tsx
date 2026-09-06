import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { KatalogDuzeni } from "@/components/katalog-duzeni";
import {
  AktifSuzgecler,
  FacetPaneli,
  KatalogBos,
  KatalogHata,
  SAYFA_BOYU,
  Sayfalama,
  SiralamaSecici,
  UrunIzgarasi,
  katalogLinkKurucu,
  katalogSorgusuCoz,
  suzgecVarMi,
  type HamKatalogSorgusu,
} from "@/components/katalog-listesi";
import { Markdown } from "@/lib/markdown";
import {
  koleksiyonGetir,
  markalariGetir,
  nitelikleriGetir,
  urunSayfasiGetir,
} from "@/lib/api/catalog";

/**
 * Koleksiyon sayfası (/koleksiyon/[handle]) — başlık koleksiyondan, ürünler
 * koleksiyonun KÜRASYON sırasıyla gelir (backend match.sort_order'a göre
 * dizer).
 *
 * Süzgeç, sıralama ve sayfalama /urunler ile AYNI bileşenlerdir. Kendi
 * sayfalamasını taşıyan eski hâli (24+1 hilesi) sayfa numarası gösteremiyor,
 * facet paneli hiç sunmuyordu — üç liste sayfasının üçüncüsü olarak geride
 * kalmıştı.
 *
 * SIRALAMA SEÇİLİRSE KÜRASYON SIRASI DEVREDEN ÇIKAR: bu bilinçlidir, müşteri
 * "artan fiyat" dediğinde kürasyon sırası bir tercih olmaktan çıkar.
 */

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<HamKatalogSorgusu>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const koleksiyon = await koleksiyonGetir(handle);
  if (!koleksiyon) return { title: "Koleksiyon" };
  return {
    title: koleksiyon.name,
    description: koleksiyon.description || undefined,
    alternates: { canonical: `/koleksiyon/${koleksiyon.handle || koleksiyon.uid}` },
  };
}

export default async function Koleksiyon({ params, searchParams }: Props) {
  const [{ handle }, ham] = await Promise.all([params, searchParams]);
  const sorgu = katalogSorgusuCoz(ham);

  const koleksiyon = await koleksiyonGetir(handle);
  if (!koleksiyon) notFound();

  let sonuc: Awaited<ReturnType<typeof urunSayfasiGetir>> = { urunler: [], toplam: 0 };
  let markalar: Awaited<ReturnType<typeof markalariGetir>> = [];
  let nitelikler: Awaited<ReturnType<typeof nitelikleriGetir>> = [];
  let hata = "";
  try {
    [sonuc, markalar, nitelikler] = await Promise.all([
      urunSayfasiGetir({
        collectionUid: koleksiyon.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
        sort: sorgu.sirala,
        inStock: sorgu.stokta,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
        limit: SAYFA_BOYU,
        offset: (sorgu.sayfa - 1) * SAYFA_BOYU,
      }),
      markalariGetir({
        collectionUid: koleksiyon.uid,
        search: sorgu.ara,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
      }).catch(() => []),
      nitelikleriGetir({
        collectionUid: koleksiyon.uid,
        search: sorgu.ara,
        brand: sorgu.marka,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
      }).catch(() => []),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const yol = `/koleksiyon/${koleksiyon.handle || koleksiyon.uid}`;
  const linkYap = katalogLinkKurucu(yol, sorgu);
  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / SAYFA_BOYU));
  const suzgecVar = suzgecVarMi(sorgu);

  return (
    <div className="space-y-5 py-6">
      <div className="space-y-2">
        <nav className="text-sm text-soft" aria-label="İçerik yolu">
          <Link href="/koleksiyonlar" className="hover:text-foreground hover:underline">
            Koleksiyonlar
          </Link>{" "}
          / <span className="text-foreground">{koleksiyon.name}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            {koleksiyon.name}{" "}
            <span className="text-base font-normal text-soft">({sonuc.toplam})</span>
          </h1>
          <SiralamaSecici sorgu={sorgu} linkYap={linkYap} />
        </div>
        {koleksiyon.description ? (
          <Markdown metin={koleksiyon.description} className="max-w-2xl" />
        ) : null}
      </div>

      {koleksiyon.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- harici görsel; boyut bilinmiyor
        <img
          src={koleksiyon.imageUrl}
          alt={koleksiyon.name}
          className="aspect-[4/1] w-full rounded-2xl border border-line object-cover"
        />
      ) : null}

      <Suspense>
        <KatalogDuzeni
          panel={
            <FacetPaneli
              sorgu={sorgu}
              markalar={markalar}
              facetler={nitelikler}
              linkYap={linkYap}
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
              baslik={suzgecVar ? "Sonuç bulunamadı" : "Bu koleksiyonda yayında ürün yok"}
              suzgecVar={suzgecVar}
              temizleHref={suzgecVar ? yol : "/urunler"}
            />
          ) : (
            <>
              <UrunIzgarasi urunler={sonuc.urunler} />
              <Sayfalama sayfa={sorgu.sayfa} sonSayfa={sonSayfa} linkYap={linkYap} />
            </>
          )}
        </KatalogDuzeni>
      </Suspense>
    </div>
  );
}
