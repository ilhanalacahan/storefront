"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Minus, Plus, XCircle } from "lucide-react";
import { useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart";
import { FavoriDugmesi } from "@/components/favori-dugmesi";
import { Price } from "@/components/price";
import { Yildizlar } from "@/components/yildizlar";
import { urunGetirCanli } from "@/lib/api/catalog";
import type { StorefrontProduct } from "@/lib/api/types";
import { miktar } from "@/lib/format";

/**
 * Satın alma kutusu — fiyat/stok CANLI katman:
 * sunucudan gelen (ISR'lı, bayat olabilecek) ürün `initialData` olur,
 * sayfa açılınca aynı ürün proxy'den taze çekilir ve 30 sn'de bir tazelenir.
 * Statik iskelet ile canlı verinin ayrımı budur (ERP'ye yük bindirmeden
 * doğru fiyat/stok gösterme deseni).
 */
export function BuyBox({ baslangic }: { baslangic: StorefrontProduct }) {
  const { data } = useQuery({
    queryKey: ["urun-canli", baslangic.uid],
    queryFn: () => urunGetirCanli(baslangic.uid),
    initialData: baslangic,
    refetchOnMount: "always",
    refetchInterval: 30_000,
    staleTime: 0,
  });
  const urun = data ?? baslangic;
  const [adet, setAdet] = useState(1);
  const stok = Number(urun.available);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="font-mono text-xs uppercase tracking-wider text-soft">{urun.code}</p>
        <h1 className="text-2xl font-bold leading-tight md:text-3xl">{urun.name}</h1>
        {urun.subtitle ? <p className="text-soft">{urun.subtitle}</p> : null}
        {urun.ratingCount > 0 ? (
          <a href="#yorumlar" className="inline-flex items-center gap-2 text-sm hover:underline">
            <Yildizlar puan={urun.ratingAvg} boyut="md" />
            <span className="text-soft">
              {urun.ratingAvg.replace(".", ",")} · {urun.ratingCount} değerlendirme
            </span>
          </a>
        ) : null}
      </div>

      <div className="space-y-1 rounded-2xl border border-line bg-surface p-4">
        <Price
          price={urun.price}
          compareAtPrice={urun.compareAtPrice}
          curCode={urun.curCode}
          size="lg"
        />
        <p className="text-xs text-soft">KDV (%{Number(urun.vatRate)}) dahildir</p>
      </div>

      {urun.madeToOrder ? (
        // Siparişe göre üretim (G49): stok kapısı yok — termin gösterilir.
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Siparişe özel hazırlanır
          {urun.leadDays > 0 ? ` — ${urun.leadDays} günde hazır` : ""}
        </p>
      ) : urun.inStock ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Stokta{stok > 0 && stok <= 10 ? ` — son ${miktar(urun.available)} adet` : ""}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <XCircle className="size-4" /> Stokta yok
        </p>
      )}

      <div className="flex gap-3">
        <div className="flex items-center rounded-xl border border-line bg-surface">
          <button
            type="button"
            aria-label="Azalt"
            onClick={() => setAdet((a) => Math.max(1, a - 1))}
            className="flex size-12 items-center justify-center text-soft hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center font-semibold">{adet}</span>
          <button
            type="button"
            aria-label="Artır"
            onClick={() => setAdet((a) => a + 1)}
            className="flex size-12 items-center justify-center text-soft hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <AddToCartButton
          productUid={urun.uid}
          quantity={String(adet)}
          disabled={!urun.inStock}
        />
        <FavoriDugmesi productUid={urun.uid} gorunum="buton" />
      </div>

      <ul className="space-y-1 text-xs text-soft">
        <li>• Fiyat ve stok bilgisi canlıdır; ödeme adımında bir kez daha doğrulanır.</li>
        <li>• 14 gün içinde koşulsuz iade.</li>
      </ul>
    </div>
  );
}
