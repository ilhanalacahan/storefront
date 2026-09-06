import type { Metadata } from "next";
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
import {
  kategorileriGetir,
  markalariGetir,
  nitelikleriGetir,
  urunSayfasiGetir,
} from "@/lib/api/catalog";

/**
 * Ürün listesi (PLP) — tüm katalog + arama. SÜZGEÇ DURUMU URL'DEDİR
 * (?ara=…&marka=…&sirala=…&stokta=1&enaz=…&encok=…&sayfa=…); arama kutusu
 * (header'da) 250 ms debounce ile bu adresi günceller.
 *
 * KATEGORİ SÜZGECİ DEĞİL, KATEGORİ SAYFASI: paneldeki kategori satırları
 * /kategori/[handle] sayfasına gider — kategori kendi kırıntısı, açıklaması ve
 * alt kırılımı olan bir sayfadır. Eski `?kategori=<uid>` adresi çalışmaya
 * devam eder (paylaşılmış link kırılmasın) ama yeni link üretilmez.
 *
 * SAYFALAMA GERÇEK SAYIYA DAYANIR: backend toplam kayıt sayısını döndürür.
 * SIRALAMA VE FİYAT SÜZGECİ SUNUCUDA çözülür (fiyat önbelleğinden) — istemcide
 * sıralamak yalnız o sayfayı sıralardı.
 */

export const metadata: Metadata = { title: "Tüm Ürünler" };

interface Sorgu extends HamKatalogSorgusu {
  /** Eski süzgeç adresi — geriye uyumluluk. */
  kategori?: string;
}

export default async function Urunler({ searchParams }: { searchParams: Promise<Sorgu> }) {
  const params = await searchParams;
  const sorgu = katalogSorgusuCoz(params);
  const kategori = (params.kategori ?? "").trim();

  let sonuc: Awaited<ReturnType<typeof urunSayfasiGetir>> = { urunler: [], toplam: 0 };
  let kategoriler: Awaited<ReturnType<typeof kategorileriGetir>> = [];
  let markalar: Awaited<ReturnType<typeof markalariGetir>> = [];
  let nitelikler: Awaited<ReturnType<typeof nitelikleriGetir>> = [];
  let hata = "";
  try {
    // Dördü paralel: liste her istekte, kategori/marka/nitelik facet'leri 5 dk ISR'lı.
    [sonuc, kategoriler, markalar, nitelikler] = await Promise.all([
      urunSayfasiGetir({
        search: sorgu.ara,
        categoryUid: kategori,
        brand: sorgu.marka,
        sort: sorgu.sirala,
        inStock: sorgu.stokta,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
        limit: SAYFA_BOYU,
        offset: (sorgu.sayfa - 1) * SAYFA_BOYU,
      }),
      kategorileriGetir().catch(() => []),
      markalariGetir({
        search: sorgu.ara,
        categoryUid: kategori,
        minPrice: sorgu.enAz,
        maxPrice: sorgu.enCok,
        attributes: sorgu.nitelikler,
      }).catch(() => []),
      // Tüm katalogda nitelik ekseni yalnız arama ya da kategori daraltmasında
      // anlamlı — bütün kataloğun karışık niteliklerini listelemek gürültü olurdu.
      sorgu.ara || kategori
        ? nitelikleriGetir({
            search: sorgu.ara,
            categoryUid: kategori,
            brand: sorgu.marka,
            minPrice: sorgu.enAz,
            maxPrice: sorgu.enCok,
            attributes: sorgu.nitelikler, // bağımlı facet
          }).catch(() => [])
        : Promise.resolve([]),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / SAYFA_BOYU));
  const seciliKategori = kategoriler.find((k) => k.uid === kategori);
  const kokler = kategoriler.filter(
    (k) => !k.parentUid || !kategoriler.some((p) => p.uid === k.parentUid),
  );
  const linkYap = katalogLinkKurucu("/urunler", sorgu, kategori ? { kategori } : {});
  const suzgecVar = suzgecVarMi(sorgu) || Boolean(kategori);

  return (
    <div className="space-y-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {sorgu.ara ? (
            <>&ldquo;{sorgu.ara}&rdquo; için sonuçlar</>
          ) : seciliKategori ? (
            seciliKategori.name
          ) : (
            "Tüm Ürünler"
          )}{" "}
          <span className="text-base font-normal text-soft">({sonuc.toplam})</span>
        </h1>
        <SiralamaSecici sorgu={sorgu} linkYap={linkYap} />
      </div>

      <Suspense>
        <KatalogDuzeni
          panel={
            <FacetPaneli
              sorgu={sorgu}
              markalar={markalar}
              facetler={nitelikler}
              linkYap={linkYap}
              kategoriler={kokler}
            />
          }
        >
          <AktifSuzgecler
            sorgu={sorgu}
            linkYap={linkYap}
            temizleHref="/urunler"
            facetler={nitelikler}
          />

          {hata ? (
            <KatalogHata mesaj={hata} />
          ) : sonuc.urunler.length === 0 ? (
            <KatalogBos
              baslik={suzgecVar ? "Sonuç bulunamadı" : "Bu kanalda henüz yayında ürün yok"}
              suzgecVar={suzgecVar}
              temizleHref="/urunler"
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
