"use client";

import { useQueries } from "@tanstack/react-query";

import { ProductCard } from "@/components/product-card";
import { Serit } from "@/components/serit";
import { useSonGezilenler } from "@/hooks/use-son-gezilenler";
import { urunGetirCanli } from "@/lib/api/catalog";
import type { StorefrontProduct } from "@/lib/api/types";

/**
 * SON GEZİLEN ÜRÜNLER ŞERİDİ.
 *
 * Liste tarayıcıda (localStorage), ürünler sunucudan canlı gelir — saklanan
 * uid'dir, fiyat değil (bkz. use-son-gezilenler.ts).
 *
 * ŞERİT KENDİNİ GİZLER: iz yoksa ya da hepsi düşmüşse (silinmiş/kapsam dışı
 * ürün) hiçbir başlık çizilmez. Boş bir "son gezilenler" başlığı, siteyi
 * bozuk gösterir.
 */
export function SonGezilenler({ haric, baslik = "Son Gezdikleriniz" }: { haric?: string; baslik?: string }) {
  const uidler = useSonGezilenler(haric);
  const sorgular = useQueries({
    queries: uidler.slice(0, 8).map((uid) => ({
      queryKey: ["urun", "son-gezilen", uid],
      queryFn: () => urunGetirCanli(uid),
      staleTime: 300_000,
    })),
  });
  const urunler = sorgular
    .map((q) => q.data)
    .filter((u): u is StorefrontProduct => Boolean(u));

  if (urunler.length < 2) return null;

  return (
    <Serit baslik={baslik}>
      {urunler.map((u) => (
        <div key={u.uid} className="w-44 sm:w-52">
          <ProductCard urun={u} />
        </div>
      ))}
    </Serit>
  );
}
