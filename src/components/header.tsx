"use client";

import { ShoppingBag, User, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { SearchBox } from "@/components/search-box";
import { useSepetAdedi } from "@/hooks/use-cart";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

const SITE_ADI = process.env.NEXT_PUBLIC_SITE_NAME ?? "StoreFront";

/**
 * Üst çubuk — sticky. Sepet düğmesi sayfaya gitmez, yandan açılan çekmeceyi
 * açar (mobil e-ticaret alışkanlığı); rozet canlı sepet adedini gösterir.
 */
export function Header() {
  const openDrawer = useCartStore((s) => s.openDrawer);
  const adet = useSepetAdedi();
  const account = useAuthStore((s) => s.account);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Ana sayfa">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Zap className="size-4.5" />
          </span>
          <span className="text-lg font-bold tracking-tight">{SITE_ADI}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/urunler"
            className="rounded-lg px-3 py-2 text-sm font-medium text-soft transition hover:bg-background hover:text-foreground"
          >
            Tüm Ürünler
          </Link>
          <Link
            href="/koleksiyonlar"
            className="rounded-lg px-3 py-2 text-sm font-medium text-soft transition hover:bg-background hover:text-foreground"
          >
            Koleksiyonlar
          </Link>
        </nav>

        <div className="hidden max-w-md flex-1 md:block">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/hesap"
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-soft transition hover:bg-background hover:text-foreground md:flex"
          >
            <User className="size-4.5" />
            {account ? (account.fullName || account.email).split(" ")[0] : "Giriş Yap"}
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Sepeti aç"
            className="relative flex size-10 items-center justify-center rounded-lg text-soft transition hover:bg-background hover:text-foreground"
          >
            <ShoppingBag className="size-5" />
            {adet > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {adet > 9 ? "9+" : adet}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Mobil arama — ayrı satır (başparmak erişimi) */}
      <div className="border-t border-line px-4 py-2 md:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
