"use client";

import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { CartLines, CartTotals, KargoIlerlemesi } from "@/components/cart-lines";
import { useCart } from "@/hooks/use-cart";
import { useCartStore } from "@/store/cart-store";

/**
 * Yandan açılan sepet (slide-over) — ürün eklenince kendiliğinden açılır,
 * kullanıcı sayfadan kopmadan sepetini görür (mobil UX olmazsa olmazı).
 */
export function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const { data: sepet } = useCart();
  const dolu = sepet && sepet.status === 0 && sepet.lines.length > 0;

  // Escape ile kapanış.
  useEffect(() => {
    if (!open) return;
    const dinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", dinle);
    return () => window.removeEventListener("keydown", dinle);
  }, [open, close]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Karartma */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Sepet"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="size-4.5" /> Sepetim
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Sepeti kapat"
            className="flex size-8 items-center justify-center rounded-lg text-soft hover:bg-background hover:text-foreground"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {dolu ? (
            <>
              <div className="pt-3">
                <KargoIlerlemesi sepet={sepet} />
              </div>
              <CartLines sepet={sepet} kompakt />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="size-10 text-soft/50" />
              <p className="text-sm text-soft">Sepetiniz şimdilik boş.</p>
              <Link
                href="/urunler"
                onClick={close}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
              >
                Alışverişe Başla
              </Link>
            </div>
          )}
        </div>

        {dolu ? (
          <div className="space-y-3 border-t border-line p-4">
            <CartTotals sepet={sepet} />
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/sepet"
                onClick={close}
                className="flex h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold transition hover:bg-background"
              >
                Sepete Git
              </Link>
              <Link
                href="/odeme"
                onClick={close}
                className="flex h-11 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
              >
                Ödemeye Geç
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
