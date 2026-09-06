import { Package } from "lucide-react";
import Link from "next/link";

import { Serit } from "@/components/serit";
import type { StorefrontCategory } from "@/lib/api/catalog";
import { kategoriAgaci, kategoriYolu } from "@/lib/kategori";

/**
 * KATEGORİ ŞERİDİ — ana sayfanın "nereden başlayayım" cevabı.
 *
 * KÖK kategoriler gösterilir: ana sayfada yaprak kategorileri sıralamak
 * (Kablosuz Kulaklık, Kulak İçi Kulaklık…) kataloğun tamamını değil bir
 * köşesini tanıtır. Görseli olmayan kategori için gradyan bir yer tutucu
 * çizilir — boş kutu bırakmak şeridi delik gösterirdi.
 */
export function KategoriSerit({ kategoriler }: { kategoriler: StorefrontCategory[] }) {
  const kokler = kategoriAgaci(kategoriler);
  if (kokler.length < 2) return null;

  return (
    <Serit baslik="Kategoriler" tumuHref="/kategoriler" tumuEtiketi="Kategori Rehberi">
      {kokler.map((k) => (
        <Link
          key={k.uid}
          href={kategoriYolu(k)}
          className="group w-32 shrink-0 space-y-2 text-center sm:w-36"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface transition group-hover:border-accent">
            {k.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- kategori görseli; boyut bilinmiyor
              <img
                src={k.imageUrl}
                alt={k.name}
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/15 to-accent/5 text-accent">
                <Package className="size-8" aria-hidden />
              </div>
            )}
          </div>
          <div>
            <p className="truncate text-sm font-semibold group-hover:text-accent">{k.name}</p>
            <p className="text-xs text-soft">{k.productCount} ürün</p>
          </div>
        </Link>
      ))}
    </Serit>
  );
}
