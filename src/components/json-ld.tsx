import type { StorefrontProduct } from "@/lib/api/types";
import { SITE_ADI, SITE_URL, mutlak, urunYolu } from "@/lib/site";

/**
 * YAPISAL VERİ (schema.org / JSON-LD).
 *
 * Arama motoruna sayfanın NE OLDUĞUNU makine-okunur söyler: fiyat, stok
 * durumu, marka, kırıntı yolu. Ürün sonuçlarında fiyat ve "stokta" rozetinin
 * çıkması buna bağlıdır.
 *
 * VERİ SAYFADAKİYLE AYNI OLMAK ZORUNDA: JSON-LD'de görünmeyen bir fiyat
 * yazmak (ya da tersi) arama motorlarınca yaptırım sebebidir. Bu yüzden
 * bileşenler ekrana basılan `urun` nesnesinin AYNISINI kullanır — ikinci bir
 * veri yolu yoktur.
 *
 * `dangerouslySetInnerHTML` burada zorunludur: JSON-LD bir <script> gövdesidir.
 * İçerik JSON.stringify'dan geçer ve `<` kaçırılır — ürün adında "</script>"
 * geçse bile etiket erken kapanmaz.
 */

function Yapisal({ veri }: { veri: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(veri).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Site geneli kimlik — her sayfada bir kez (layout). */
export function SiteYapisalVerisi() {
  return (
    <Yapisal
      veri={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: SITE_ADI,
            url: SITE_URL,
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_ADI,
            url: SITE_URL,
            publisher: { "@id": `${SITE_URL}/#organization` },
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/urunler?ara={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
        ],
      }}
    />
  );
}

const PARA_BIRIMLERI: Record<number, string> = { 1: "TRY", 2: "USD", 3: "EUR" };

/** Ürün sayfası — fiyat, stok, marka ve kırıntı yolu. */
export function UrunYapisalVerisi({ urun }: { urun: StorefrontProduct }) {
  const url = mutlak(urunYolu(urun));
  const gorseller = urun.images.length ? urun.images : urun.imageUrl ? [urun.imageUrl] : [];

  // MTO ürün stokta sayılır (üretilerek karşılanır); ata kart satılamaz.
  const durum = urun.isVariantMaster
    ? "https://schema.org/InStock"
    : urun.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return (
    <Yapisal
      veri={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            name: urun.name,
            description: urun.subtitle || urun.description || urun.name,
            sku: urun.code || undefined,
            mpn: urun.mfrCode || undefined,
            gtin13: urun.barcode || undefined,
            image: gorseller,
            ...(urun.brandName ? { brand: { "@type": "Brand", name: urun.brandName } } : {}),
            offers: {
              "@type": "Offer",
              url,
              // Fiyat SUNUCUDAN gelen etiket fiyatıdır (KDV dahil) — burada
              // hesap yapılmaz, olduğu gibi taşınır.
              price: urun.price,
              priceCurrency: PARA_BIRIMLERI[urun.curCode] ?? "TRY",
              availability: durum,
              seller: { "@id": `${SITE_URL}/#organization` },
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "Ürünler",
                item: `${SITE_URL}/urunler`,
              },
              { "@type": "ListItem", position: 3, name: urun.name, item: url },
            ],
          },
        ],
      }}
    />
  );
}
