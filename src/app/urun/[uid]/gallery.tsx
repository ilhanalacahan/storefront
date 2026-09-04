"use client";

import { useState } from "react";

import { ProductImage } from "@/components/product-image";
import type { ProductImageItem } from "@/lib/api/types";

/**
 * Galeri — büyük görsel + küçük seçiciler (tek görselde seçici gizlenir).
 * Her görselin kendi alt metni vardır (ERP'deki alt_text; boşsa sunucu ürün
 * adını koyar) — ekran okuyucu "görsel 3" değil "yan görünüm" duyar.
 */
export function Gallery({ gorseller }: { gorseller: ProductImageItem[] }) {
  const [aktif, setAktif] = useState(0);
  const secili = gorseller[aktif] ?? { url: "", alt: "" };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-surface">
        <ProductImage
          src={secili.url}
          alt={secili.alt}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
      {gorseller.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gorseller.map((g, i) => (
            <button
              key={g.url + i}
              type="button"
              aria-label={g.alt || `Görsel ${i + 1}`}
              aria-pressed={i === aktif}
              onClick={() => setAktif(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-xl border transition ${
                i === aktif ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-soft"
              }`}
            >
              <ProductImage src={g.url} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
