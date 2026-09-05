import type { Metadata } from "next";
import Link from "next/link";

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
import {
  kategorileriGetir,
  markalariGetir,
  nitelikleriGetir,
  urunSayfasiGetir,
} from "@/lib/api/catalog";
import { kategoriYolu } from "@/lib/kategori";

/**
 * Ürün listesi (PLP) — tüm katalog + arama. SÜZGEÇ DURUMU URL'DEDİR
 * (?ara=…&marka=…&sirala=…&stokta=1&sayfa=…); arama kutusu (header'da)
 * 300 ms debounce ile bu adresi günceller.
 *
 * KATEGORİ ÇİPLERİ KATEGORİ SAYFASINA GİDER (/kategori/[handle]): kategori
 * bir süzgeç değil, kendi kırıntısı ve alt kategorileri olan bir sayfadır.
 * Eski `?kategori=<uid>` adresi çalışmaya devam eder (paylaşılmış link
 * kırılmasın) ama yeni link üretilmez.
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
        attributes: sorgu.nitelikler,
        limit: SAYFA_BOYU,
        offset: (sorgu.sayfa - 1) * SAYFA_BOYU,
      }),
      kategorileriGetir().catch(() => []),
      markalariGetir({ search: sorgu.ara, categoryUid: kategori, attributes: sorgu.nitelikler }).catch(
        () => [],
      ),
      // Tüm katalogda nitelik ekseni yalnız arama ya da kategori daraltmasında
      // anlamlı — bütün kataloğun karışık niteliklerini listelemek gürültü olurdu.
      sorgu.ara || kategori
        ? nitelikleriGetir({
            search: sorgu.ara,
            categoryUid: kategori,
            brand: sorgu.marka,
            attributes: sorgu.nitelikler, // bağımlı facet
          }).catch(() => [])
        : Promise.resolve([]),
    ]);
  } catch (e) {
    hata = e instanceof Error ? e.message : "Ürünler yüklenemedi.";
  }

  const sonSayfa = Math.max(1, Math.ceil(sonuc.toplam / SAYFA_BOYU));
  const seciliKategori = kategoriler.find((k) => k.uid === kategori);
  const kokler = kategoriler.filter((k) => !k.parentUid || !kategoriler.some((p) => p.uid === k.parentUid));
  const linkYap = katalogLinkKurucu("/urunler", sorgu, kategori ? { kategori } : {});
  const suzgecVar = suzgecVarMi(sorgu) || Boolean(kategori);

  return (
    <div className="space-y-5 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
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
        {sonSayfa > 1 ? (
          <p className="text-sm text-soft">
            Sayfa {sorgu.sayfa} / {sonSayfa}
          </p>
        ) : null}
      </div>

      {/* Kök kategoriler — her çip kendi sayfasına gider. */}
      {kokler.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {kokler.map((k) => (
            <Link
              key={k.uid}
              href={kategoriYolu(k)}
              title={k.fullName}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                k.uid === kategori
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-line bg-surface hover:border-soft"
              }`}
            >
              {k.name} <span className="opacity-60">({k.productCount})</span>
            </Link>
          ))}
          <Link
            href="/kategoriler"
            className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-accent transition hover:border-accent"
          >
            Tüm kategoriler
          </Link>
        </div>
      ) : null}

      <KatalogSuzgecCubugu sorgu={sorgu} markalar={markalar} linkYap={linkYap} />
      <NitelikSuzgeci facetler={nitelikler} sorgu={sorgu} linkYap={linkYap} />

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
    </div>
  );
}
