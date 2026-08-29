import Link from "next/link";

import type { ProductVariant, StorefrontProduct } from "@/lib/api/types";
import { fiyat } from "@/lib/format";

/**
 * VARYANT SEÇİCİ — "Renk / Beden" satırları.
 *
 * Server Component: seçim bir DURUM değil, bir ADRESTİR. Her varyantın kendi
 * ürün sayfası vardır, bu yüzden seçici istemci durumu tutmaz —
 * bağlantıdır. Kazancı üç katlı: seçilen varyantın linki paylaşılabilir, geri
 * tuşu çalışır ve her varyant arama motorunda kendi başına indekslenir.
 *
 * EKSENLER SATIR SATIR ÇİZİLİR: aynı eksenin (ör. "Beden") tüm değerleri bir
 * arada durur. Eksen içindeki hedef, DİĞER eksenleri koruyan varyanttır —
 * "Kırmızı / L" bakarken "M"ye basınca "Kırmızı / M" açılır, rastgele bir
 * varyant değil.
 *
 * Fiyat ve stok sunucudan çözülmüş gelir (G2): seçici hesap yapmaz, gösterir.
 */
export function VaryantSecici({ urun }: { urun: StorefrontProduct }) {
  if (urun.variants.length === 0) return null;

  // Eksen adları, ailedeki ilk dolu seçenek dizisinden türer — ayrı bir eksen
  // listesi tutmuyoruz (ikinci bir gerçek olurdu).
  const eksenler: string[] = [];
  for (const v of urun.variants) {
    for (const o of v.options) {
      if (!eksenler.includes(o.name)) eksenler.push(o.name);
    }
  }
  if (eksenler.length === 0) return null;

  const mevcut = new Map(urun.options.map((o) => [o.name, o.value]));

  return (
    <div className="space-y-4">
      {eksenler.map((eksen) => {
        // Bu eksenin benzersiz değerleri, ailedeki görülme sırasıyla.
        const degerler: string[] = [];
        for (const v of urun.variants) {
          const d = v.options.find((o) => o.name === eksen)?.value;
          if (d && !degerler.includes(d)) degerler.push(d);
        }
        return (
          <div key={eksen}>
            <p className="mb-2 text-sm font-medium">
              {eksen}
              {mevcut.get(eksen) ? (
                <span className="ml-1.5 font-normal text-soft">{mevcut.get(eksen)}</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {degerler.map((deger) => {
                const hedef = varyantBul(urun, mevcut, eksen, deger);
                const secili = mevcut.get(eksen) === deger;
                return (
                  <Deger
                    key={deger}
                    deger={deger}
                    secili={secili}
                    hedef={hedef}
                    curCode={urun.curCode}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Eksende `deger`e geçmek için gidilecek varyant.
 *
 * DİĞER EKSENLERİ KORUMAYA çalışır; tam eşleşme yoksa (o kombinasyon
 * üretilmemiş olabilir) yalnız bu eksene uyan İLK varyanta düşer. Hiçbiri
 * yoksa değer tıklanamaz çizilir — var olmayan bir kombinasyona bağlantı
 * vermek, müşteriyi "ürün bulunamadı" sayfasına götürürdü.
 */
function varyantBul(
  urun: StorefrontProduct,
  mevcut: Map<string, string>,
  eksen: string,
  deger: string,
): ProductVariant | null {
  const uyar = (v: ProductVariant, tamEslesme: boolean) => {
    const kendi = v.options.find((o) => o.name === eksen)?.value;
    if (kendi !== deger) return false;
    if (!tamEslesme) return true;
    for (const [ad, d] of mevcut) {
      if (ad === eksen) continue;
      if (v.options.find((o) => o.name === ad)?.value !== d) return false;
    }
    return true;
  };
  return (
    urun.variants.find((v) => uyar(v, true)) ??
    urun.variants.find((v) => uyar(v, false)) ??
    null
  );
}

function Deger({
  deger,
  secili,
  hedef,
  curCode,
}: {
  deger: string;
  secili: boolean;
  hedef: ProductVariant | null;
  curCode: number;
}) {
  const temel = "rounded-xl border px-3.5 py-2 text-sm transition";

  if (secili) {
    return (
      <span className={`${temel} border-accent bg-accent/10 font-semibold text-accent`}>
        {deger}
      </span>
    );
  }
  if (!hedef) {
    return (
      <span className={`${temel} cursor-not-allowed border-line text-soft/50 line-through`}>
        {deger}
      </span>
    );
  }
  return (
    <Link
      // Seçici uid'le bağlar (kardeş varyantın handle'ı yanıtta taşınmıyor);
      // açılan sayfanın canonical'ı handle'lı adrese işaret eder, yani arama
      // motoru için tek bir adres kalır.
      href={`/urun/${hedef.uid}`}
      className={`${temel} ${
        hedef.inStock
          ? "border-line hover:border-accent"
          : "border-line text-soft/60 line-through hover:border-soft"
      }`}
      title={hedef.inStock ? fiyat(hedef.price, curCode) : "Tükendi"}
    >
      {deger}
    </Link>
  );
}

/**
 * ATA KARTI UYARISI — ata satılamaz (evrak/stok yasağı).
 * Müşteriyi sepete değil, bir varyanta yönlendirir.
 */
export function AtaUyarisi({ urun }: { urun: StorefrontProduct }) {
  const ilk = urun.variants.find((v) => v.inStock) ?? urun.variants[0];
  return (
    <div className="rounded-xl border border-line bg-background p-4">
      <p className="text-sm font-medium">Bir seçenek seçin</p>
      <p className="mt-1 text-sm text-soft">
        Bu ürün seçeneklere göre satılır; yukarıdan bir seçenek seçtiğinizde
        fiyat ve stok görünür.
      </p>
      {ilk ? (
        <Link
          href={`/urun/${ilk.uid}`}
          className="mt-3 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          {ilk.name}
        </Link>
      ) : null}
    </div>
  );
}
