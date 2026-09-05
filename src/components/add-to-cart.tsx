"use client";

import { Loader2, Plus, ShoppingCart } from "lucide-react";

import { useSepeteEkle } from "@/hooks/use-cart";
import type { SepetParametreGirdisi } from "@/lib/api/cart";

/** Kart köşesindeki hızlı ekleme düğmesi (mobil UX: tek dokunuş). */
export function QuickAddButton({
  productUid,
  disabled,
}: {
  productUid: string;
  disabled?: boolean;
}) {
  const ekle = useSepeteEkle();
  return (
    <button
      type="button"
      aria-label="Sepete ekle"
      disabled={disabled || ekle.isPending}
      onClick={() => ekle.mutate({ productUid })}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      {ekle.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
    </button>
  );
}

/**
 * PDP'deki büyük "Sepete Ekle" düğmesi — miktar seçimiyle birlikte. params
 * doluysa (şerit boyu gibi) satır o ölçüyle açılır; etiket "Stokta Yok"
 * yerine çağıranın verdiği metni basabilir (ölçü eksikse "Ölçü girin").
 */
export function AddToCartButton({
  productUid,
  quantity,
  disabled,
  params,
  etiket,
}: {
  productUid: string;
  quantity: string;
  disabled?: boolean;
  params?: SepetParametreGirdisi[];
  etiket?: string;
}) {
  const ekle = useSepeteEkle();
  return (
    <button
      type="button"
      disabled={disabled || ekle.isPending}
      onClick={() => ekle.mutate({ productUid, quantity, params })}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      {ekle.isPending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <ShoppingCart className="size-5" />
      )}
      {disabled ? etiket ?? "Stokta Yok" : "Sepete Ekle"}
    </button>
  );
}
