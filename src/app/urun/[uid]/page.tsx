import type { Metadata } from "next";
import type { StorefrontProduct } from "@/lib/api/types";
import { notFound } from "next/navigation";

import { urunGetir } from "@/lib/api/catalog";
import { BuyBox } from "./buy-box";
import { Gallery } from "./gallery";
import { AtaUyarisi, VaryantSecici } from "@/components/varyant-secici";
import { UrunYapisalVerisi } from "@/components/json-ld";
import { SITE_ADI, mutlak, urunYolu } from "@/lib/site";

/**
 * Ürün detayı (PDP) — iki katmanlı veri stratejisi:
 *
 *  - SAYFA İSKELETİ (ad, açıklama, galeri, meta): Server Component, 120 sn
 *    ISR — SEO botları tam içerik görür, ERP her ziyarette sorgulanmaz.
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
    const aciklama = urun.subtitle || urun.description.slice(0, 160) || urun.name;
    const yol = urunYolu(urun);
    return {
      title: urun.name,
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
  let urun: Awaited<ReturnType<typeof urunGetir>> = null;
  try {
    urun = await urunGetir(uid);
  } catch {
    urun = null;
  }
  if (!urun) notFound();

  return (
    <div className="py-6">
      <UrunYapisalVerisi urun={urun} />
      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery
          images={urun.images.length ? urun.images : urun.imageUrl ? [urun.imageUrl] : []}
          alt={urun.name}
        />
        <div className="space-y-6">
          {/* Varyant seçici SUNUCUDA çizilir: seçim bir durum değil, adrestir
              (her varyantın kendi sayfası var). BuyBox'tan önce gelir —
              müşteri önce hangi varyanta baktığını görmeli, sonra fiyatı. */}
          <VaryantSecici urun={urun} />
          {urun.isVariantMaster ? <AtaUyarisi urun={urun} /> : <BuyBox baslangic={urun} />}
        </div>
      </div>

      {urun.description ? (
        <section className="mt-12 max-w-3xl space-y-3">
          <h2 className="text-lg font-bold">Ürün Açıklaması</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-soft">
            {urun.description}
          </p>
        </section>
      ) : null}

      <UrunBilgileri urun={urun} />
    </div>
  );
}

/** Kimlik/özellik satırları — yalnız dolu alanlar listelenir; hepsi boşsa bölüm hiç çıkmaz. */
function UrunBilgileri({ urun }: { urun: StorefrontProduct }) {
  const satirlar: [string, string][] = [
    ["Marka", urun.brandName],
    ["Model", urun.modelName],
    ["Ürün Kodu", urun.code],
    ["Üretici Kodu", urun.mfrCode],
    ["Barkod", urun.barcode],
    ["Birim", urun.unit],
  ].filter((s): s is [string, string] => Boolean(s[1]));
  if (!satirlar.length) return null;
  return (
    <section className="mt-12 max-w-3xl space-y-3">
      <h2 className="text-lg font-bold">Ürün Bilgileri</h2>
      <dl className="divide-y divide-line rounded-xl border border-line text-sm">
        {satirlar.map(([etiket, deger]) => (
          <div key={etiket} className="flex items-center justify-between px-4 py-2.5">
            <dt className="text-soft">{etiket}</dt>
            <dd className="font-medium">{deger}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
