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

/** Bu adedin altında "son N adet" uyarısı basılır (aciliyet, uydurma değil gerçek stok). */
const AZALAN_STOK_ESIGI = 5;

/**
 * VİTRİN KARTI (Server Component) — statik kısmı önbelleklenebilir; etkileşimli
 * parçalar client island'dır (hızlı ekle, favori, karşılaştır, hızlı bakış).
 *
 * İKİNCİ GÖRSEL SAF CSS'TİR: iki resim üst üste durur, `group-hover` biri
 * kaybolur. Durum tutulmadığı için kart sunucu bileşeni kalır — hover için
 * kartı istemciye çevirmek, listedeki 24 kartı da istemciye taşımak olurdu.
 *
 * ROZET DÜZENİ: indirim SOL ÜST (fiyatın yanında değil, gözün ilk gittiği
 * köşede), durum rozetleri SOL ALT, kalp SAĞ ÜST. Üçü çakışmaz — eski
 * düzende indirim rozeti ile kalp aynı köşedeydi.
 */
export function ProductCard({ urun }: { urun: StorefrontProduct }) {
  const azalanStok =
    urun.inStock && !urun.madeToOrder && Number(urun.available) > 0 &&
    Number(urun.available) <= AZALAN_STOK_ESIGI;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40">
      <Link
        href={urunYolu(urun)}
        className="relative block aspect-square overflow-hidden bg-background"
        aria-label={urun.name}
      >
        <DiscountBadge price={urun.price} compareAtPrice={urun.compareAtPrice} />

        {/* Ana görsel + hover görseli (varsa) */}
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <div
            className={`size-full ${urun.hoverImageUrl ? "transition-opacity duration-300 group-hover:opacity-0" : ""}`}
          >
            <ProductImage
              src={urun.imageUrl}
              alt={urun.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
          {urun.hoverImageUrl ? (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ProductImage
                src={urun.hoverImageUrl}
                alt={`${urun.name} — ikinci görsel`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ) : null}
        </div>

        {/* Durum rozetleri — sol alt */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1">
          {urun.madeToOrder ? (
            <Rozet renk="badge">
              {urun.leadDays > 0 ? `${urun.leadDays} günde hazır` : "Siparişe özel"}
            </Rozet>
          ) : !urun.inStock ? (
            <Rozet renk="badge">Tükendi</Rozet>
          ) : azalanStok ? (
            <Rozet renk="price">Son {miktar(urun.available)} adet</Rozet>
          ) : null}
        </div>
      </Link>

      <FavoriDugmesi productUid={urun.uid} />
      <KartAksiyonlari urun={urun} />

      <div className="flex flex-1 flex-col gap-1 p-3">
        {urun.brandName ? (
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-soft">
            {urun.brandName}
          </p>
        ) : null}
        <Link href={urunYolu(urun)} className="hover:text-accent">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{urun.name}</h3>
        </Link>
        {urun.ratingCount > 0 ? (
          <Yildizlar puan={urun.ratingAvg} etiket={`(${urun.ratingCount})`} />
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price price={urun.price} compareAtPrice={urun.compareAtPrice} curCode={urun.curCode} />
          {urun.vatIncluded === false ? <span className="text-[11px] text-soft">KDV hariç</span> : null}
          <QuickAddButton productUid={urun.uid} disabled={!urun.inStock} />
        </div>
      </div>
    </div>
  );
}

function Rozet({ renk, children }: { renk: "badge" | "price"; children: React.ReactNode }) {
  const sinif =
    renk === "price"
      ? "bg-price text-white"
      : "bg-badge text-badge-foreground";
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${sinif}`}>
      {children}
    </span>
  );
}
