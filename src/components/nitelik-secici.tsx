import Link from "next/link";

import type { ProductSiblings } from "@/lib/api/types";
import { urunYolu } from "@/lib/site";

/**
 * NİTELİK SEÇİCİ — "Genişlik / Kalınlık" satırları (nitelik kümesi → kart).
 *
 * Testere şeridi gibi ürünlerde varyant yoktur: 27/0,9 ile 34/1,1 ayrı
 * KARTLARDIR. Varyant seçicisiyle aynı ilke: seçim bir DURUM değil, bir
 * ADRESTİR — her değer kardeş kartın sayfasına bağlanır; link paylaşılır,
 * geri tuşu çalışır, her kart kendi başına indekslenir.
 *
 * Eksenler ve hedefler SUNUCUDAN gelir (/products/{uid}/siblings): hedef,
 * öteki eksenleri koruyan kardeştir; korunamıyorsa (o kombinasyon üretilmiyor)
 * yalnız bu eksene uyan ilk kardeş, soluk çizilir. Tek değerli eksen gelmez.
 */
export function NitelikSecici({ kardesler }: { kardesler: ProductSiblings | null }) {
  if (!kardesler || kardesler.axes.length === 0) return null;
  return (
    <div className="space-y-4">
      {kardesler.axes.map((eksen) => (
        <div key={eksen.key}>
          <p className="mb-2 text-sm font-medium">
            {eksen.label}
            {eksen.values.some((v) => v.current) ? (
              <span className="ml-1.5 font-normal text-soft">
                {degerEtiketi(eksen.type, eksen.values.find((v) => v.current)?.value ?? "")}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {eksen.values.map((v) => {
              const etiket = degerEtiketi(eksen.type, v.value);
              const sinif = `rounded-xl border px-3 py-2 text-sm transition ${
                v.current
                  ? "border-accent bg-accent/10 font-semibold text-accent"
                  : v.exact
                    ? "border-line hover:border-foreground"
                    : "border-dashed border-line text-soft hover:border-foreground"
              }`;
              if (v.current || !v.uid) {
                return (
                  <span key={v.value} className={sinif} aria-current={v.current ? "true" : undefined}>
                    {etiket}
                  </span>
                );
              }
              return (
                <Link
                  key={v.value}
                  href={urunYolu({ uid: v.uid, handle: v.handle })}
                  className={sinif}
                  title={v.exact ? v.name : `${v.name} — öteki ölçüler farklı`}
                >
                  {etiket}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Değer metni: evet/hayır çevrilir, sayı tr-TR ayraçla yazılır, metin aynen. */
function degerEtiketi(tip: string, deger: string): string {
  if (tip === "boolean") return deger === "true" ? "Evet" : "Hayır";
  if (tip === "number") {
    const n = Number(deger);
    return Number.isFinite(n) ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 6 }).format(n) : deger;
  }
  return deger;
}
