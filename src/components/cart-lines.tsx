"use client";

import { Minus, Plus, Trash2, Truck } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/product-image";
import { useSatirAyarla } from "@/hooks/use-cart";
import type { Cart, CartLine } from "@/lib/api/types";
import { fiyat, miktar } from "@/lib/format";

/**
 * Sepet satırları + toplam bloğu — çekmece ve /sepet sayfası ortak kullanır.
 * Tüm tutarlar SUNUCUNUN hesabıdır; burada yalnız gösterilir.
 */
export function CartLines({ sepet, kompakt = false }: { sepet: Cart; kompakt?: boolean }) {
  const ayarla = useSatirAyarla();

  // Satır KİMLİĞİYLE adreslenir: aynı ürün farklı ölçüyle ayrı satırdır.
  const degistir = (line: CartLine, fark: number) => {
    const yeni = Number(line.quantity) + fark;
    ayarla.mutate({
      productUid: line.productUid,
      lineUid: line.lineUid,
      quantity: String(Math.max(0, yeni)),
    });
  };

  return (
    <ul className="divide-y divide-line">
      {sepet.lines.map((line) => {
        const yol = line.handle || line.productUid ? `/urun/${encodeURIComponent(line.handle || line.productUid)}` : "";
        const gorsel = (
          <div className={`relative shrink-0 overflow-hidden rounded-xl border border-line bg-background ${kompakt ? "size-14" : "size-20"}`}>
            <ProductImage src={line.imageUrl} alt={line.name} sizes={kompakt ? "56px" : "80px"} />
          </div>
        );
        return (
          <li key={line.lineUid || line.productUid} className="flex gap-3 py-3">
            {yol ? <Link href={yol}>{gorsel}</Link> : gorsel}

            <div className="min-w-0 flex-1">
              {yol ? (
                <Link href={yol} className="block truncate text-sm font-medium hover:text-accent">
                  {line.name}
                  {line.paramSummary ? (
                    <span className="text-soft"> — {line.paramSummary}</span>
                  ) : null}
                </Link>
              ) : (
                <p className="truncate text-sm font-medium">{line.name}</p>
              )}
              {line.params?.length ? (
                // Ölçülü satır: taban miktar sunucudan (2 adet × 2,85 m = 5,7 m).
                <p className="text-xs text-soft">
                  {miktar(line.baseQuantity)} {line.unit || ""}
                </p>
              ) : null}
              <p className="text-xs text-soft">
                {fiyat(sepet.vatIncluded === false ? line.unitPrice : line.grossUnitPrice, sepet.curCode)}{sepet.vatIncluded === false ? <span className="ml-1">(KDV hariç)</span> : null}
                {Number(line.discountAmount) > 0 ? (
                  <span className="ml-2 text-success">
                    −{fiyat(line.discountAmount, sepet.curCode)} indirim
                  </span>
                ) : null}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-line">
                  <button
                    type="button"
                    aria-label="Azalt"
                    disabled={ayarla.isPending}
                    onClick={() => degistir(line, -1)}
                    className="flex size-7 items-center justify-center text-soft hover:text-foreground disabled:opacity-40"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="min-w-7 text-center text-sm font-medium">
                    {miktar(line.quantity)}
                  </span>
                  <button
                    type="button"
                    aria-label="Artır"
                    disabled={ayarla.isPending}
                    onClick={() => degistir(line, 1)}
                    className="flex size-7 items-center justify-center text-soft hover:text-foreground disabled:opacity-40"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Satırı sil"
                  disabled={ayarla.isPending}
                  onClick={() =>
                    ayarla.mutate({
                      productUid: line.productUid,
                      lineUid: line.lineUid,
                      quantity: "0",
                    })
                  }
                  className="flex size-7 items-center justify-center rounded-lg text-soft hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="text-right text-sm font-semibold">
              {fiyat(line.lineTotal, sepet.curCode)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * ÜCRETSİZ KARGO ÇUBUĞU.
 *
 * ÜÇ DEĞER DE SUNUCUDAN GELİR (freeShippingThreshold / Remaining / Progress):
 * "kargo bedavaya X TL kaldı" bir çıkarma işlemidir ve G5 istemcide parasal
 * aritmetiği yasaklar. Burada yalnız gösterim vardır.
 *
 * Eşik tanımlı değilse (kanalda ücretsiz kargo tarifesi yok) hiç çizilmez.
 */
export function KargoIlerlemesi({ sepet }: { sepet: Cart }) {
  if (!sepet.freeShippingThreshold) return null;
  const ulasti = sepet.freeShippingRemaining === "0" || Number(sepet.freeShippingRemaining) <= 0;

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm">
        <Truck className={`size-4 ${ulasti ? "text-success" : "text-soft"}`} aria-hidden />
        {ulasti ? (
          <span className="font-medium text-success">Ücretsiz kargo kazandınız!</span>
        ) : (
          <span>
            Ücretsiz kargoya{" "}
            <strong className="text-price">
              {fiyat(sepet.freeShippingRemaining, sepet.curCode)}
            </strong>{" "}
            kaldı
          </span>
        )}
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={sepet.freeShippingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ücretsiz kargo ilerlemesi"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${ulasti ? "bg-success" : "bg-accent"}`}
          style={{ width: `${Math.min(100, Math.max(0, sepet.freeShippingProgress))}%` }}
        />
      </div>
    </div>
  );
}

export function CartTotals({ sepet }: { sepet: Cart }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between text-soft">
        <dt>Ara toplam (KDV hariç)</dt>
        <dd>{fiyat(sepet.subTotal, sepet.curCode)}</dd>
      </div>
      {Number(sepet.discountTotal) > 0 ? (
        <div className="flex justify-between text-success">
          <dt>İndirim{sepet.promotionName ? ` — ${sepet.promotionName}` : ""}</dt>
          <dd>−{fiyat(sepet.discountTotal, sepet.curCode)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between text-soft">
        <dt>KDV</dt>
        <dd>{fiyat(sepet.taxTotal, sepet.curCode)}</dd>
      </div>
      {Number(sepet.shippingFee) > 0 ? (
        <div className="flex justify-between text-soft">
          <dt>Kargo</dt>
          <dd>{fiyat(sepet.shippingFee, sepet.curCode)}</dd>
        </div>
      ) : sepet.shippingMethodCode ? (
        <div className="flex justify-between text-success">
          <dt>Kargo</dt>
          <dd>Ücretsiz</dd>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
        <dt>Genel Toplam</dt>
        <dd>{fiyat(sepet.grandTotal, sepet.curCode)}</dd>
      </div>
      {/* Kur SEPETTE SABİTLENDİ (K7a): sipariş ve tahsilat bu kurla kesilir.
          Müşteri fiyatı hangi kurla gördüyse ona satın alır — bunu söylemek,
          ertesi gün kur oynadığında "toplam neden değişti" sorusunu hiç
          doğurmamaktır. TL sepette anlamsız olduğu için yazılmaz. */}
      {sepet.curCode > 1 && Number(sepet.exchRate) > 0 ? (
        <p className="pt-1 text-xs text-soft">
          Kur sepette sabitlendi: 1 birim = {sepet.exchRate} TL
        </p>
      ) : null}
    </dl>
  );
}
