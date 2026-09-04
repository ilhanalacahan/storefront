import { FolderTree } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { kategorileriGetir } from "@/lib/api/catalog";
import { kategoriAgaci, kategoriYolu, type KategoriDugumu } from "@/lib/kategori";

/**
 * Kategori dizini — ağacın tamamı. Mobilde açılır menü olmadığı için asıl
 * kategori gezinme yüzeyi burasıdır; masaüstünde menünün "Tümü" hedefidir.
 * Yalnız (alt ağacında) ürünü olan kategoriler gelir; boş dal gösterilmez.
 */

export const metadata: Metadata = { title: "Kategoriler" };

export default async function Kategoriler() {
  let agac: KategoriDugumu[] = [];
  let hata = "";
  try {
    agac = kategoriAgaci(await kategorileriGetir());
  } catch (e) {
    hata = e instanceof Error ? e.message : "Kategoriler yüklenemedi.";
  }

  return (
    <div className="space-y-5 py-6">
      <h1 className="text-2xl font-bold">Kategoriler</h1>

      {hata ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-soft">
          {hata}
        </div>
      ) : agac.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-12 text-center">
          <FolderTree className="size-10 text-soft/50" />
          <p className="font-medium">Henüz kategori yok</p>
          <p className="text-sm text-soft">Yayında ürünü olan bir kategori bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agac.map((k) => (
            <KategoriKarti key={k.uid} kategori={k} />
          ))}
        </div>
      )}
    </div>
  );
}

function KategoriKarti({ kategori }: { kategori: KategoriDugumu }) {
  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
      <Link href={kategoriYolu(kategori)} className="flex items-baseline justify-between gap-2">
        <span className="font-semibold hover:text-accent">{kategori.name}</span>
        <span className="text-xs text-soft">{kategori.productCount} ürün</span>
      </Link>
      {kategori.cocuklar.length ? (
        <ul className="space-y-1 border-t border-line pt-2">
          {kategori.cocuklar.map((c) => (
            <li key={c.uid} className="flex items-baseline justify-between gap-2">
              <Link href={kategoriYolu(c)} className="text-sm text-soft hover:text-foreground">
                {c.name}
                {c.cocuklar.length ? (
                  <span className="ml-1 text-xs opacity-60">+{c.cocuklar.length} alt</span>
                ) : null}
              </Link>
              <span className="text-xs text-soft/70">{c.productCount}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
