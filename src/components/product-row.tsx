import Link from "next/link";

import { FavoriDugmesi } from "@/components/favori-dugmesi";
import { KartAksiyonlari } from "@/components/kart-aksiyonlari";
import { Price, DiscountBadge } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { QuickAddButton } from "@/components/add-to-cart";
import { Yildizlar } from "@/components/yildizlar";
import type { StorefrontProduct } from "@/lib/api/types";
import { miktar } from "@/lib/format";
import { urunYolu } from "@/lib/site";

/**
 * LİSTE SATIRI — ürün kartının yatay hâli.
 *
 * Kartla aynı veriyi gösterir, farkı YERLEŞİMDİR: dar bir ızgarada kırpılan
 * ürün adı ve alt başlık burada tam görünür. Uzun adlı kataloglarda (yapı
 * market, yedek parça, tekstil) müşteri iki ürünü ancak tam adıyla ayırt eder;
 * bu yüzden görünüm seçimi bir süs değil, kataloğa göre değişen bir ihtiyaçtır.
 *
 * Kart gibi Server Component'tır; etkileşimli parçalar aynı client island'lar.
 */
export function ProductRow({ urun }: { urun: StorefrontProduct }) {
  const azalanStok =
    urun.inStock && !urun.madeToOrder && Number(urun.available) > 0 &&
    Number(urun.available) <= 5;

  return (
    <div className="group relative flex gap-4 rounded-2xl border border-line bg-surface p-3 transition hover:border-accent/40">
      <Link
        href={urunYolu(urun)}
        className="relative block size-28 shrink-0 overflow-hidden rounded-xl bg-background sm:size-36"
        aria-label={urun.name}
      >
        <DiscountBadge price={urun.price} compareAtPrice={urun.compareAtPrice} />
        <ProductImage
          src={urun.imageUrl}
          alt={urun.name}
          sizes="(max-width: 640px) 112px, 144px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {urun.brandName ? (
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-soft">
            {urun.brandName}
          </p>
        ) : null}
        <Link href={urunYolu(urun)} className="hover:text-accent">
          <h3 className="line-clamp-2 font-medium leading-snug">{urun.name}</h3>
        </Link>
        {urun.subtitle ? (
          <p className="line-clamp-2 text-sm text-soft">{urun.subtitle}</p>
        ) : null}
        {urun.ratingCount > 0 ? (
          <Yildizlar puan={urun.ratingAvg} etiket={`(${urun.ratingCount})`} />
        ) : null}

        <p className="mt-auto pt-1 text-xs">
          {urun.madeToOrder ? (
            <span className="text-accent">
              {urun.leadDays > 0 ? `${urun.leadDays} günde hazırlanır` : "Siparişe özel"}
            </span>
          ) : !urun.inStock ? (
            <span className="text-danger">Tükendi</span>
          ) : azalanStok ? (
            <span className="text-price">Son {miktar(urun.available)} adet</span>
          ) : (
            <span className="text-success">Stokta</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2 pl-2">
        <Price price={urun.price} compareAtPrice={urun.compareAtPrice} curCode={urun.curCode} />
        <QuickAddButton productUid={urun.uid} disabled={!urun.inStock} />
      </div>

      <FavoriDugmesi productUid={urun.uid} />
      <KartAksiyonlari urun={urun} />
    </div>
  );
}
