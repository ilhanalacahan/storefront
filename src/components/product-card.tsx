import Link from "next/link";

import { FavoriDugmesi } from "@/components/favori-dugmesi";
import { Price, DiscountBadge } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { QuickAddButton } from "@/components/add-to-cart";
import { Yildizlar } from "@/components/yildizlar";
import type { StorefrontProduct } from "@/lib/api/types";
import { urunYolu } from "@/lib/site";

/**
 * Vitrin kartı (Server Component) — statik kısmı önbelleklenebilir;
 * etkileşimli parçalar QuickAddButton ve FavoriDugmesi'dir (client island).
 */
export function ProductCard({ urun }: { urun: StorefrontProduct }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40">
      <Link
        href={urunYolu(urun)}
        className="relative block aspect-square overflow-hidden"
        aria-label={urun.name}
      >
        <DiscountBadge price={urun.price} compareAtPrice={urun.compareAtPrice} />
        {urun.madeToOrder ? (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-foreground/70 px-1.5 py-0.5 text-xs font-medium text-background">
            {urun.leadDays > 0 ? `${urun.leadDays} günde hazırlanır` : "Siparişe özel"}
          </span>
        ) : !urun.inStock ? (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-foreground/70 px-1.5 py-0.5 text-xs font-medium text-background">
            Tükendi
          </span>
        ) : null}
        <div className="size-full transition-transform duration-300 group-hover:scale-105">
          <ProductImage
            src={urun.imageUrl}
            alt={urun.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      </Link>
      {/* Kalp, indirim rozetinin altında kalmasın diye görsel kutusunun dışına
          değil üstüne (absolute) konur; tıklaması karta gitmez. */}
      <FavoriDugmesi productUid={urun.uid} />

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={urunYolu(urun)} className="hover:text-accent">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{urun.name}</h3>
        </Link>
        {urun.subtitle ? (
          <p className="line-clamp-1 text-xs text-soft">{urun.subtitle}</p>
        ) : null}
        {urun.ratingCount > 0 ? (
          <Yildizlar puan={urun.ratingAvg} etiket={`(${urun.ratingCount})`} />
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price price={urun.price} compareAtPrice={urun.compareAtPrice} curCode={urun.curCode} />
          <QuickAddButton productUid={urun.uid} disabled={!urun.inStock} />
        </div>
      </div>
    </div>
  );
}
