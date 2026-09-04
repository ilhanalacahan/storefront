import type { KirintiOgesi } from "@/components/kirinti";
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
 * veri yolu yoktur. Kırıntı da öyle: ekrandaki Kirinti bileşenine giden liste
 * buraya da gider.
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

/** Kırıntı listesini schema.org BreadcrumbList'e çevirir ("Ana Sayfa" başa eklenir). */
function kirintiListesi(ogeler: KirintiOgesi[], sonUrl?: string) {
  const halkalar = [{ name: "Ana Sayfa", item: SITE_URL }, ...ogeler.map((o) => ({
    name: o.ad,
    item: o.href ? mutlak(o.href) : sonUrl,
  }))];
  return {
    "@type": "BreadcrumbList",
    itemListElement: halkalar.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: h.name,
      ...(h.item ? { item: h.item } : {}),
    })),
  };
}

/** Kategori / koleksiyon sayfası kırıntısı — ekrandaki Kirinti ile aynı listeyi alır. */
export function KirintiYapisalVerisi({ ogeler, url }: { ogeler: KirintiOgesi[]; url: string }) {
  return (
    <Yapisal
      veri={{
        "@context": "https://schema.org",
        ...kirintiListesi(ogeler, mutlak(url)),
      }}
    />
  );
}

/**
 * Ürün sayfası — fiyat, stok, marka, teknik özellikler ve kırıntı yolu.
 * `kirinti` kategori zinciridir (ürünün kendisi hariç); ekrandaki liste ile
 * aynı olmak zorunda.
 */
export function UrunYapisalVerisi({
  urun,
  kirinti,
}: {
  urun: StorefrontProduct;
  kirinti: KirintiOgesi[];
}) {
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
            ...(urun.categories.length ? { category: urun.categories[0].fullName } : {}),
            // Teknik özellikler ekrandaki tabloyla aynı kaynaktan (attributes).
            ...(urun.attributes.length
              ? {
                  additionalProperty: urun.attributes.map((a) => ({
                    "@type": "PropertyValue",
                    name: a.label,
                    value: a.value,
                  })),
                }
              : {}),
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
          kirintiListesi([...kirinti, { ad: urun.name }], url),
        ],
      }}
    />
  );
}
