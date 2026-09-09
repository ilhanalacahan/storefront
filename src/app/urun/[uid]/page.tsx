import type { Metadata } from "next";
import type { ProductAttribute, StorefrontProduct } from "@/lib/api/types";
import { notFound } from "next/navigation";

import { kardesleriGetir, kategorileriGetir, urunGetir, urunleriGetir } from "@/lib/api/catalog";
import { kargoTarifesiGetir } from "@/lib/api/cart";
import { BuyBox } from "./buy-box";
import { Gallery } from "./gallery";
import { NitelikSecici } from "@/components/nitelik-secici";
import { Paylas } from "@/components/paylas";
import { ProductCard } from "@/components/product-card";
import { Serit } from "@/components/serit";
import { SonGezilenler } from "@/components/son-gezilenler";
import { TeslimatKutusu } from "@/components/teslimat-kutusu";
import { UrunIzi } from "@/components/urun-izi";
import { UrunSekmeleri, type UrunSekmesi } from "@/components/urun-sekmeleri";
import { UrunSorulari } from "@/components/urun-sorulari";
import { AtaUyarisi, VaryantSecici } from "@/components/varyant-secici";
import { UrunYapisalVerisi } from "@/components/json-ld";
import { Kirinti, type KirintiOgesi } from "@/components/kirinti";
import { UrunYorumlari } from "@/components/urun-yorumlari";
import { tarih } from "@/lib/format";
import { kategoriYolu, kategoriZinciri } from "@/lib/kategori";
import { Markdown } from "@/lib/markdown";
import { SITE_ADI, mutlak, urunYolu } from "@/lib/site";

/**
 * Ürün detayı (PDP) — iki katmanlı veri stratejisi:
 *
 *  - SAYFA İSKELETİ (ad, açıklama, galeri, özellikler, kırıntı, meta): Server
 *    Component, 120 sn ISR — SEO botları tam içerik görür, ERP her ziyarette
 *    sorgulanmaz.
 *  - FİYAT + STOK: BuyBox (client) sayfa açılınca aynı ürünü canlı çeker ve
 *    tazeler — önbellekteki iskelet bayatlasa bile müşteri güncel fiyatı görür.
 *
 * YERLEŞİM: solda galeri, sağda YAPIŞKAN satın alma kutusu. Uzun teknik
 * özellik listelerinde müşteri sayfayı kaydırdıkça fiyat ve "sepete ekle"
 * ekrandan çıkmaz — ticari vitrinlerin dönüşüm açısından en belirgin farkı
 * budur.
 *
 * ALT BÖLÜM SEKMELİDİR: açıklama, teknik özellikler, teslimat/iade ve yorumlar
 * alt alta uzayan dört blok yerine tek yükseklikte durur.
 */

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  try {
    const urun = await urunGetir(uid);
    if (!urun) return { title: "Ürün bulunamadı" };
    // SEO meta'sı kartta yazılmışsa o, yoksa ad/alt başlıktan türetilir.
    const baslik = urun.metaTitle || urun.name;
    const aciklama =
      urun.metaDescription || urun.subtitle || urun.description.slice(0, 160) || urun.name;
    const yol = urunYolu(urun);
    return {
      title: baslik,
      description: aciklama,
      // CANONICAL HANDLE'LI ADRESTİR: aynı ürüne hem /urun/<uid> hem
      // /urun/<handle> ile ulaşılabildiği için hangisinin asıl olduğunu
      // söylemek zorundayız — yoksa arama motoru iki ayrı sayfa sayar.
      alternates: { canonical: yol },
      openGraph: {
        type: "website",
        title: urun.name,
        description: aciklama,
        url: mutlak(yol),
        siteName: SITE_ADI,
        images: urun.imageUrl ? [{ url: urun.imageUrl, alt: urun.name }] : undefined,
      },
      twitter: {
        card: urun.imageUrl ? "summary_large_image" : "summary",
        title: urun.name,
        description: aciklama,
      },
    };
  } catch {
    return { title: "Ürün" };
  }
}

export default async function UrunDetay({ params }: Props) {
  const { uid } = await params;
  // Ürün ve kategori listesi paralel: kırıntı zinciri kategori listesinden
  // (5 dk ISR, tüm sayfalarla paylaşılır) çözülür — ürün yanıtı yalnız
  // yaprak kategorisini taşır.
  // Kardeş kartlar da paralel: nitelik seçicisi (genişlik/kalınlık) sunucuda
  // çözülür ve link olarak çizilir — varyant seçicisiyle aynı ilke.
  const [urun, kategoriler, kardesler, kargoYontemleri] = await Promise.all([
    urunGetir(uid).catch(() => null),
    kategorileriGetir().catch(() => []),
    kardesleriGetir(uid).catch(() => null),
    kargoTarifesiGetir(),
  ]);
  if (!urun) notFound();

  // Kırıntı: ürünün en derin kategorisinden köke. Kategori listede yoksa
  // (kapsam dışı/pasif ata) yalnız kendisi gösterilir — zincir kopmaz.
  const yaprak = urun.categories[0];
  const zincir = yaprak ? kategoriZinciri(kategoriler, yaprak.uid) : [];
  const kirinti: KirintiOgesi[] = (zincir.length ? zincir : yaprak ? [yaprak] : []).map((k) => ({
    ad: k.name,
    href: kategoriYolu(k),
  }));

  // Benzer ürünler: aynı yaprak kategoriden, bu ürün hariç. Kategorisi yoksa
  // hiç sorulmaz — "benzer" diye kataloğun rastgele bir köşesini göstermek
  // müşteriye yardım etmez.
  const benzerler = yaprak
    ? (await urunleriGetir({ categoryUid: yaprak.uid, limit: 12 }).catch(() => []))
        .filter((u) => u.uid !== urun.uid)
        .slice(0, 10)
    : [];

  const gorseller = urun.gallery.length
    ? urun.gallery
    : urun.imageUrl
      ? [{ url: urun.imageUrl, alt: urun.name }]
      : [];

  const sekmeler: UrunSekmesi[] = [];
  if (urun.description) {
    sekmeler.push({
      anahtar: "aciklama",
      etiket: "Ürün Açıklaması",
      // Açıklama Markdown olarak çizilir (başlık, liste, kalın, bağlantı);
      // düz metin de olduğu gibi paragraf olur. Ham HTML işlenmez (V10).
      icerik: <Markdown metin={urun.description} />,
    });
  }
  if (urun.attributes.length || urunBilgiSatirlari(urun).length) {
    sekmeler.push({
      anahtar: "ozellikler",
      etiket: "Teknik Özellikler",
      icerik: (
        <div className="grid gap-6 lg:grid-cols-2">
          <TeknikOzellikler nitelikler={urun.attributes} />
          <UrunBilgileri urun={urun} />
        </div>
      ),
    });
  }
  sekmeler.push({
    anahtar: "teslimat",
    etiket: "Teslimat ve İade",
    icerik: <TeslimatKutusu yontemler={kargoYontemleri} />,
  });
  sekmeler.push({
    anahtar: "yorumlar",
    etiket: "Değerlendirmeler",
    rozet: urun.ratingCount,
    // Yorumlar istemcide çekilir: liste kişiye özel (kendi yorumu) ve
    // onay anında tazelenmeli — ISR'lı iskelete girmez.
    icerik: <UrunYorumlari productUid={urun.uid} />,
  });
  sekmeler.push({
    anahtar: "sorular",
    etiket: "Soru-Cevap",
    // Sorular da istemcide: müşteri kendi onay bekleyen sorusunu görmeli.
    icerik: <UrunSorulari productUid={urun.uid} />,
  });

  return (
    <div className="space-y-8 py-5">
      <UrunYapisalVerisi urun={urun} kirinti={kirinti} />
      <UrunIzi uid={urun.uid} />
      <Kirinti ogeler={[...kirinti, { ad: urun.name }]} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Gallery gorseller={gorseller} />
        </div>

        <div className="space-y-5">
          {/* Varyant seçici SUNUCUDA çizilir: seçim bir durum değil, adrestir
              (her varyantın kendi sayfası var). BuyBox'tan önce gelir —
              müşteri önce hangi varyanta baktığını görmeli, sonra fiyatı. */}
          <VaryantSecici urun={urun} />
          {/* Nitelik kümesi → kart: aynı kategorideki kardeş kartlar arasında
              ölçüyle geçiş (varyant olmayan aileler). Varyant ailesi varsa
              eksenler zaten oradan gelir; kardeş seçici yalnız niteliklilerde
              çıkar (sunucu boş eksen döndürür). */}
          {urun.variants.length === 0 ? <NitelikSecici kardesler={kardesler} /> : null}
          {urun.isVariantMaster ? <AtaUyarisi urun={urun} /> : <BuyBox baslangic={urun} />}

          <div className="flex items-center justify-between border-t border-line pt-3">
            <Paylas baslik={urun.name} metin={urun.subtitle} />
            {urun.brandName ? (
              <a
                href={`/urunler?marka=${encodeURIComponent(urun.brandName)}`}
                className="text-sm text-soft transition hover:text-accent"
              >
                {urun.brandName} ürünleri
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <UrunSekmeleri sekmeler={sekmeler} />

      {benzerler.length >= 2 ? (
        <Serit
          baslik="Benzer Ürünler"
          altBaslik={yaprak ? yaprak.name : undefined}
          tumuHref={yaprak ? kategoriYolu(yaprak) : undefined}
        >
          {benzerler.map((u) => (
            <div key={u.uid} className="w-44 sm:w-52">
              <ProductCard urun={u} />
            </div>
          ))}
        </Serit>
      ) : null}

      <SonGezilenler haric={urun.uid} />
    </div>
  );
}

/**
 * Nitelik değerini gösterime çevirir. Değer sunucudan METİN gelir; tipine
 * göre biçimlenir: evet/hayır, tr-TR tarih, tr-TR sayı. Sayı ölçüdür, para
 * değildir — yine de hesap yapılmaz, yalnız ayraç değişir.
 */
function nitelikDegeri(a: ProductAttribute): string {
  switch (a.type) {
    case "boolean":
      return a.value === "true" ? "Evet" : "Hayır";
    case "date":
      return tarih(a.value);
    case "number": {
      const n = Number(a.value);
      return Number.isFinite(n)
        ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 6 }).format(n)
        : a.value;
    }
    default:
      return a.value;
  }
}

/** Kategori şablonundan gelen özellikler — boşsa bölüm hiç çıkmaz. */
function TeknikOzellikler({ nitelikler }: { nitelikler: ProductAttribute[] }) {
  if (!nitelikler.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Özellikler</p>
      <dl className="divide-y divide-line rounded-xl border border-line text-sm">
        {nitelikler.map((a) => (
          <div key={a.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-soft">{a.label}</dt>
            <dd className="text-right font-medium">{nitelikDegeri(a)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Kimlik satırları — yalnız dolu alanlar. Tek yerde üretilir ki sekme
 *  başlığının çizilip çizilmeyeceği de aynı listeye bakabilsin. */
function urunBilgiSatirlari(urun: StorefrontProduct): [string, string][] {
  return (
    [
      ["Marka", urun.brandName],
      ["Model", urun.modelName],
      ["Kategori", urun.categories[0]?.fullName ?? ""],
      ["Ürün Kodu", urun.code],
      ["Üretici Kodu", urun.mfrCode],
      ["Barkod", urun.barcode],
      ["Birim", urun.unit],
    ] as [string, string][]
  ).filter((s): s is [string, string] => Boolean(s[1]));
}

function UrunBilgileri({ urun }: { urun: StorefrontProduct }) {
  const satirlar = urunBilgiSatirlari(urun);
  if (!satirlar.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Ürün Bilgileri</p>
      <dl className="divide-y divide-line rounded-xl border border-line text-sm">
        {satirlar.map(([etiket, deger]) => (
          <div key={etiket} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-soft">{etiket}</dt>
            <dd className="text-right font-medium">{deger}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
