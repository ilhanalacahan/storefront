"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { favoriler } from "@/lib/api/yorum";
import { useAuthStore } from "@/store/auth-store";

/**
 * Favoriler — müşterinin kalp bastığı ürünler, vitrin kartı olarak (fiyat ve
 * stok listeyle aynı zenginleştirmeden gelir). Girişsizken hesaba yönlendirir.
 */
export default function FavorilerSayfasi() {
  const token = useAuthStore((s) => s.token);
  const q = useQuery({
    queryKey: ["favoriler", "urunler"],
    queryFn: () => favoriler(token),
    enabled: !!token,
  });

  return (
    <div className="space-y-5 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Heart className="size-6 text-danger" /> Favorilerim
        {q.data ? <span className="text-base font-normal text-soft">({q.data.length})</span> : null}
      </h1>

      {!token ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-soft">
          Favorilerinizi görmek için{" "}
          <Link href="/hesap" className="font-medium text-accent hover:underline">
            giriş yapın
          </Link>
          .
        </div>
      ) : q.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-line/40" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-soft">
          Favoriler yüklenemedi.
        </div>
      ) : q.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-12 text-center">
          <Heart className="size-10 text-soft/50" />
          <p className="font-medium">Henüz favoriniz yok</p>
          <p className="text-sm text-soft">Beğendiğiniz ürünlerdeki kalbe dokunun; burada toplansın.</p>
          <Link href="/urunler" className="text-sm font-medium text-accent hover:underline">
            Ürünlere göz at
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {q.data.map((u) => (
            <ProductCard key={u.uid} urun={u} />
          ))}
        </div>
      )}
    </div>
  );
}
