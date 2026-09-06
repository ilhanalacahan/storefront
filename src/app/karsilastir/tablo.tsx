"use client";

import { useQueries } from "@tanstack/react-query";
import { BarChart3, Loader2, Trash2, X } from "lucide-react";
import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { Yildizlar } from "@/components/yildizlar";
import { urunGetirCanli } from "@/lib/api/catalog";
import { miktar, tarih } from "@/lib/format";
import type { ProductAttribute, StorefrontProduct } from "@/lib/api/types";
import { urunYolu } from "@/lib/site";
import { useKarsilastirmaStore } from "@/store/karsilastirma-store";

/**
 * KARŞILAŞTIRMA TABLOSU.
 *
 * Ürünler CANLI çekilir (uid → detay): karşılaştırma listesinde saklanan tek
 * şey uid'dir, çünkü saklanan bir fiyat kopyası saatler içinde bayatlar ve
 * müşteriye yan yana iki yanlış fiyat gösterirdi (G2).
 *
 * SATIRLAR BİRLEŞİMDEN TÜRER: her ürünün nitelik anahtarları birleştirilir,
 * bir üründe olmayan özellik "—" ile gösterilir. Sabit bir özellik listesi
 * yazmak, kategoriye göre değişen nitelik şablonuyla (G46'nın aynı gerekçesi)
 * ilk gün bayatlardı.
 */
export function KarsilastirmaTablosu() {
  const uidler = useKarsilastirmaStore((s) => s.uidler);
  const cikar = useKarsilastirmaStore((s) => s.cikar);
  const temizle = useKarsilastirmaStore((s) => s.temizle);

  const sorgular = useQueries({
    queries: uidler.map((uid) => ({
      queryKey: ["urun", "karsilastirma", uid],
      queryFn: () => urunGetirCanli(uid),
      staleTime: 60_000,
    })),
  });

  if (!uidler.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-12 text-center">
        <BarChart3 className="size-10 text-soft/50" />
        <p className="font-medium">Karşılaştırma listeniz boş</p>
        <p className="max-w-md text-sm text-soft">
          Ürün kartlarının üzerine geldiğinizde çıkan karşılaştırma simgesiyle en fazla dört
          ürünü buraya ekleyebilirsiniz.
        </p>
        <Link href="/urunler" className="text-sm font-medium text-accent hover:underline">
          Ürünlere göz at
        </Link>
      </div>
    );
  }

  const yukleniyor = sorgular.some((q) => q.isLoading);
  const urunler = sorgular
    .map((q) => q.data)
    .filter((u): u is StorefrontProduct => Boolean(u));

  if (yukleniyor && !urunler.length) {
    return (
      <div className="flex h-48 items-center justify-center text-soft">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  // Nitelik anahtarlarının birleşimi — ilk görüldüğü sıra korunur.
  const anahtarlar: { key: string; label: string; type: ProductAttribute["type"] }[] = [];
  for (const u of urunler) {
    for (const a of u.attributes) {
      if (!anahtarlar.some((x) => x.key === a.key)) {
        anahtarlar.push({ key: a.key, label: a.label, type: a.type });
      }
    }
  }

  const satirlar: { etiket: string; deger: (u: StorefrontProduct) => React.ReactNode }[] = [
    { etiket: "Marka", deger: (u) => u.brandName || "—" },
    { etiket: "Model", deger: (u) => u.modelName || "—" },
    { etiket: "Ürün Kodu", deger: (u) => u.code || "—" },
    {
      etiket: "Puan",
      deger: (u) =>
        u.ratingCount > 0 ? <Yildizlar puan={u.ratingAvg} etiket={`(${u.ratingCount})`} /> : "—",
    },
    {
      etiket: "Stok",
      deger: (u) =>
        u.madeToOrder ? (
          <span className="text-accent">
            {u.leadDays > 0 ? `${u.leadDays} günde hazır` : "Siparişe özel"}
          </span>
        ) : u.inStock ? (
          <span className="text-success">Stokta ({miktar(u.available)})</span>
        ) : (
          <span className="text-danger">Tükendi</span>
        ),
    },
    ...anahtarlar.map((a) => ({
      etiket: a.label || a.key,
      deger: (u: StorefrontProduct) => {
        const bul = u.attributes.find((x) => x.key === a.key);
        return bul ? nitelikDegeri(bul) : "—";
      },
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-soft">{urunler.length} ürün karşılaştırılıyor</p>
        <button
          type="button"
          onClick={temizle}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-soft transition hover:border-danger/40 hover:text-danger"
        >
          <Trash2 className="size-4" /> Listeyi temizle
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-surface p-3 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-soft">
                Özellik
              </th>
              {urunler.map((u) => (
                <th key={u.uid} className="min-w-48 border-l border-line p-3 align-top">
                  <div className="relative space-y-2 text-left">
                    <button
                      type="button"
                      aria-label={`${u.name} ürününü listeden çıkar`}
                      onClick={() => cikar(u.uid)}
                      className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-background text-soft transition hover:text-danger"
                    >
                      <X className="size-4" />
                    </button>
                    <Link
                      href={urunYolu(u)}
                      className="relative block aspect-square overflow-hidden rounded-xl border border-line bg-background"
                    >
                      <ProductImage src={u.imageUrl} alt={u.name} sizes="12rem" />
                    </Link>
                    <Link href={urunYolu(u)} className="line-clamp-2 font-medium hover:text-accent">
                      {u.name}
                    </Link>
                    <Price
                      price={u.price}
                      compareAtPrice={u.compareAtPrice}
                      curCode={u.curCode}
                    />
                    <div className="flex">
                      <AddToCartButton
                        productUid={u.uid}
                        quantity="1"
                        disabled={!u.inStock && !u.madeToOrder}
                      />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s, i) => (
              <tr key={s.etiket} className={i % 2 ? "bg-background/50" : ""}>
                <th
                  scope="row"
                  className={`sticky left-0 z-10 p-3 text-left font-medium text-soft ${
                    i % 2 ? "bg-background/50" : "bg-surface"
                  }`}
                >
                  {s.etiket}
                </th>
                {urunler.map((u) => (
                  <td key={u.uid} className="border-l border-line p-3">
                    {s.deger(u)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Nitelik değeri gösterimi — PDP'deki kuralın aynısı (tip biçimi belirler). */
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
      return a.value || "—";
  }
}
