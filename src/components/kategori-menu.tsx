"use client";

import { ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";

import type { StorefrontCategory } from "@/lib/api/catalog";
import { kategoriAgaci, kategoriYolu, type KategoriDugumu } from "@/lib/kategori";

/**
 * Masaüstü kategori menüsü — üst çubukta "Kategoriler" açılır paneli.
 *
 * CSS ile açılır (hover + focus-within): ekstra durum yok, klavyeyle de
 * gezilebilir. Kök kategoriler sütun başlığı, çocukları altında; ikinci
 * seviyeden derini menüye girmez — o derinlik kategori sayfasının işidir.
 * Kategori yoksa hiç çizilmez (menüde boş başlık, kırık site izlenimi verir).
 */
export function KategoriMenu({ kategoriler }: { kategoriler: StorefrontCategory[] }) {
  const agac = kategoriAgaci(kategoriler);
  if (!agac.length) return null;

  return (
    <div className="group relative">
      <Link
        href="/kategoriler"
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-soft transition hover:bg-background hover:text-foreground"
      >
        <LayoutGrid className="size-4" />
        Kategoriler
        <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden />
      </Link>

      <div className="invisible absolute left-0 top-full z-50 w-max max-w-[min(90vw,64rem)] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="grid max-h-[70vh] grid-flow-col grid-rows-[repeat(auto-fill,minmax(0,1fr))] gap-x-8 gap-y-4 overflow-auto rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-black/10 dark:shadow-black/50"
          style={{ gridTemplateRows: `repeat(${Math.min(agac.length, 4)}, auto)` }}
        >
          {agac.map((k) => (
            <Sutun key={k.uid} kategori={k} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Sutun({ kategori }: { kategori: KategoriDugumu }) {
  return (
    <div className="min-w-40 space-y-1.5">
      <Link
        href={kategoriYolu(kategori)}
        className="block text-sm font-semibold hover:text-accent"
      >
        {kategori.name}
        <span className="ml-1 text-xs font-normal text-soft">({kategori.productCount})</span>
      </Link>
      {kategori.cocuklar.length ? (
        <ul className="space-y-1">
          {kategori.cocuklar.slice(0, 8).map((c) => (
            <li key={c.uid}>
              <Link href={kategoriYolu(c)} className="text-sm text-soft hover:text-foreground">
                {c.name}
              </Link>
            </li>
          ))}
          {kategori.cocuklar.length > 8 ? (
            <li>
              <Link href={kategoriYolu(kategori)} className="text-xs font-medium text-accent hover:underline">
                Tümü ({kategori.cocuklar.length})
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
