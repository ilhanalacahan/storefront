import type { Metadata } from "next";
import type { ProductAttribute, StorefrontProduct } from "@/lib/api/types";
import { notFound } from "next/navigation";

import { kategorileriGetir, urunGetir } from "@/lib/api/catalog";
import { BuyBox } from "./buy-box";
import { Gallery } from "./gallery";
import { AtaUyarisi, VaryantSecici } from "@/components/varyant-secici";
import { UrunYapisalVerisi } from "@/components/json-ld";
import { Kirinti, type KirintiOgesi } from "@/components/kirinti";
import { UrunYorumlari } from "@/components/urun-yorumlari";
import { tarih } from "@/lib/format";
import { kategoriYolu, kategoriZinciri } from "@/lib/kategori";
import { SITE_ADI, mutlak, urunYolu } from "@/lib/site";

/**
 * Ürün detayı (PDP) — iki katmanlı veri stratejisi:
 *
 *  - SAYFA İSKELETİ (ad, açıklama, galeri, özellikler, kırıntı, meta): Server
 *    Component, 120 sn ISR — SEO botları tam içerik görür, ERP her ziyarette
 *    sorgulanmaz.
 *  - FİYAT + STOK: BuyBox (client) sayfa açılınca aynı ürünü canlı çeker ve
 *    tazeler — önbellekteki iskelet bayatlasa bile müşteri güncel fiyatı görür.
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
  const [urun, kategoriler] = await Promise.all([
    urunGetir(uid).catch(() => null),
    kategorileriGetir().catch(() => []),
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

  const gorseller = urun.gallery.length
    ? urun.gallery
    : urun.imageUrl
      ? [{ url: urun.imageUrl, alt: urun.name }]
      : [];

  return (
    <div className="space-y-6 py-6">
      <UrunYapisalVerisi urun={urun} kirinti={kirinti} />
      <Kirinti ogeler={[...kirinti, { ad: urun.name }]} />

      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery gorseller={gorseller} />
        <div className="space-y-6">
          {/* Varyant seçici SUNUCUDA çizilir: seçim bir durum değil, adrestir
              (her varyantın kendi sayfası var). BuyBox'tan önce gelir —
              müşteri önce hangi varyanta baktığını görmeli, sonra fiyatı. */}
          <VaryantSecici urun={urun} />
          {urun.isVariantMaster ? <AtaUyarisi urun={urun} /> : <BuyBox baslangic={urun} />}
        </div>
      </div>

      {urun.description ? (
        <section className="mt-6 max-w-3xl space-y-3">
          <h2 className="text-lg font-bold">Ürün Açıklaması</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-soft">
            {urun.description}
          </p>
        </section>
      ) : null}

      <TeknikOzellikler nitelikler={urun.attributes} />
      <UrunBilgileri urun={urun} />
      {/* Yorumlar istemcide çekilir: liste kişiye özel (kendi yorumu) ve
          onay anında tazelenmeli — ISR'lı iskelete girmez. */}
      <UrunYorumlari productUid={urun.uid} />
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
    <section className="max-w-3xl space-y-3">
      <h2 className="text-lg font-bold">Teknik Özellikler</h2>
      <dl className="divide-y divide-line rounded-xl border border-line text-sm">
        {nitelikler.map((a) => (
          <div key={a.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-soft">{a.label}</dt>
            <dd className="text-right font-medium">{nitelikDegeri(a)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Kimlik/özellik satırları — yalnız dolu alanlar listelenir; hepsi boşsa bölüm hiç çıkmaz. */
function UrunBilgileri({ urun }: { urun: StorefrontProduct }) {
  const satirlar: [string, string][] = [
    ["Marka", urun.brandName],
    ["Model", urun.modelName],
    ["Kategori", urun.categories[0]?.fullName ?? ""],
    ["Ürün Kodu", urun.code],
    ["Üretici Kodu", urun.mfrCode],
    ["Barkod", urun.barcode],
    ["Birim", urun.unit],
  ].filter((s): s is [string, string] => Boolean(s[1]));
  if (!satirlar.length) return null;
  return (
    <section className="max-w-3xl space-y-3">
      <h2 className="text-lg font-bold">Ürün Bilgileri</h2>
      <dl className="divide-y divide-line rounded-xl border border-line text-sm">
        {satirlar.map(([etiket, deger]) => (
          <div key={etiket} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-soft">{etiket}</dt>
            <dd className="text-right font-medium">{deger}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
