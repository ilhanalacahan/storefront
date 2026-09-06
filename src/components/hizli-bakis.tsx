"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart";
import { FavoriDugmesi } from "@/components/favori-dugmesi";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { Yildizlar } from "@/components/yildizlar";
import { urunGetirCanli } from "@/lib/api/catalog";
import { miktar } from "@/lib/format";
import { urunYolu } from "@/lib/site";

/**
 * HIZLI BAKIŞ MODALI — listeden ayrılmadan ürünü gözden geçirme.
 *
 * VERİ CANLI ÇEKİLİR: modal kartın elindeki liste satırını kullanmaz, ürünü
 * detay ucundan ister. Sebep V7'dir — galeri, varyant ve parametreler yalnız
 * detayda doludur; liste satırıyla çizilen bir modal, varyantlı üründe
 * "seçenek yok" gibi görünürdü.
 *
 * PARAMETRELİ VE VARYANTLI ÜRÜN MODALDA SATILMAZ: ölçü girişi ve eksen seçimi
 * PDP'nin işidir (sunucu bileşimi, kardeş kart çözümü). Modal o ürünlerde
 * sepete ekleme yerine "Ürüne git" der — yarım bir seçim akışı, hiç olmayan
 * bir akıştan kötüdür.
 */
export function HizliBakis({ uid, onKapat }: { uid: string; onKapat: () => void }) {
  const [gorselIndeks, setGorselIndeks] = useState(0);
  const { data: urun, isLoading } = useQuery({
    queryKey: ["urun", "hizli-bakis", uid],
    queryFn: () => urunGetirCanli(uid),
    staleTime: 30_000,
  });

  useEffect(() => {
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
    };
    document.addEventListener("keydown", kapat);
    return () => {
      document.body.style.overflow = eski;
      document.removeEventListener("keydown", kapat);
    };
  }, [onKapat]);

  const gorseller = urun?.gallery?.length
    ? urun.gallery
    : urun?.imageUrl
      ? [{ url: urun.imageUrl, alt: urun.name }]
      : [];
  const secilebilir = urun ? urun.variants.length > 0 || urun.parameters.length > 0 : false;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button type="button" aria-label="Kapat" onClick={onKapat} className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ürün önizleme"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl"
      >
        <button
          type="button"
          aria-label="Kapat"
          onClick={onKapat}
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-surface/90 text-soft shadow backdrop-blur transition hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {isLoading || !urun ? (
          <div className="flex h-64 items-center justify-center text-soft">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <p className="text-sm">Ürün bilgisi alınamadı.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-background">
                <ProductImage
                  src={gorseller[gorselIndeks]?.url ?? ""}
                  alt={gorseller[gorselIndeks]?.alt ?? urun.name}
                  sizes="(max-width: 640px) 90vw, 24rem"
                />
              </div>
              {gorseller.length > 1 ? (
                <div className="serit">
                  {gorseller.slice(0, 6).map((g, i) => (
                    <button
                      key={g.url}
                      type="button"
                      onClick={() => setGorselIndeks(i)}
                      aria-label={`${i + 1}. görsel`}
                      className={`relative size-14 overflow-hidden rounded-lg border transition ${
                        i === gorselIndeks ? "border-accent" : "border-line hover:border-soft"
                      }`}
                    >
                      <ProductImage src={g.url} alt={g.alt} sizes="56px" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              {urun.brandName ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-soft">{urun.brandName}</p>
              ) : null}
              <h2 className="text-lg font-bold leading-snug">{urun.name}</h2>
              {urun.ratingCount > 0 ? (
                <Yildizlar puan={urun.ratingAvg} etiket={`(${urun.ratingCount} değerlendirme)`} />
              ) : null}
              <Price
                price={urun.price}
                compareAtPrice={urun.compareAtPrice}
                curCode={urun.curCode}
                size="lg"
              />
              {urun.subtitle ? <p className="text-sm text-soft">{urun.subtitle}</p> : null}

              <p className="text-sm">
                {urun.madeToOrder ? (
                  <span className="text-accent">
                    {urun.leadDays > 0 ? `${urun.leadDays} günde hazırlanır` : "Siparişe özel üretilir"}
                  </span>
                ) : urun.inStock ? (
                  <span className="text-success">Stokta ({miktar(urun.available)} adet)</span>
                ) : (
                  <span className="text-danger">Tükendi</span>
                )}
              </p>

              <div className="mt-auto space-y-2 pt-2">
                {secilebilir ? (
                  <Link
                    href={urunYolu(urun)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover"
                  >
                    Seçenekleri gör <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <AddToCartButton
                      productUid={urun.uid}
                      quantity="1"
                      disabled={!urun.inStock && !urun.madeToOrder}
                    />
                    <div className="relative">
                      <FavoriDugmesi productUid={urun.uid} gorunum="buton" />
                    </div>
                  </div>
                )}
                <Link
                  href={urunYolu(urun)}
                  className="flex items-center justify-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  Ürün sayfasına git <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
