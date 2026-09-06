import Link from "next/link";

import type { StorefrontBrandItem } from "@/lib/api/catalog";

/**
 * MARKA ŞERİDİ — "hangi markaları satıyorsunuz" sorusunun ana sayfadaki
 * cevabı ve aynı zamanda bir süzgeç kısayolu.
 *
 * LOGO YOKTUR, ad yazılır: marka logosu ERP'de tutulmaz ve internetten logo
 * çekmek hem telif hem de kırık görsel demektir. Ad, marka süzgecinin
 * beklediği metnin ta kendisidir (harf duyarsız tam eşleşme).
 */
export function MarkaSerit({ markalar }: { markalar: StorefrontBrandItem[] }) {
  const gosterilen = markalar.slice(0, 16);
  if (gosterilen.length < 3) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-lg font-bold md:text-xl">Popüler Markalar</h2>
        <Link href="/urunler" className="text-sm font-medium text-accent hover:underline">
          Tüm Ürünler
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {gosterilen.map((m) => (
          <Link
            key={m.name}
            href={`/urunler?marka=${encodeURIComponent(m.name)}`}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            {m.name}
            <span className="ml-1.5 text-xs text-soft">{m.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
