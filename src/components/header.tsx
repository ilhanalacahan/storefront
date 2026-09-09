"use client";

import {
  BarChart3,
  Heart,
  LogOut,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";

import { Arama } from "@/components/arama";
import { MegaMenu } from "@/components/mega-menu";
import { MobilMenu } from "@/components/mobil-menu";
import { useSepetAdedi } from "@/hooks/use-cart";
import { useFavoriUidleri } from "@/hooks/use-favoriler";
import type { StorefrontCategory } from "@/lib/api/catalog";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useKarsilastirmaStore } from "@/store/karsilastirma-store";

const SITE_ADI = process.env.NEXT_PUBLIC_SITE_NAME ?? "StoreFront";

/**
 * ÜST ÇUBUK — yapışkan, iki satırlı.
 *
 * Üst satır kimliğin ve eylemlerin yeridir (logo · kategori · arama · hesap ·
 * favori · karşılaştırma · sepet); alt satır gezinme kısayollarıdır. Ticari
 * vitrinlerin kalıbı budur ve sebebi ölçülebilir: arama kutusu ile sepet
 * ikonu her sayfada AYNI YERDE durur, müşteri onları aramaz.
 *
 * Menü verisi (kategori ağacı) layout'tan düz prop olarak iner — sunucuda
 * 5 dk ISR ile çekilir, tarayıcı açılışta ikinci istek atmaz.
 */
export function Header({ kategoriler }: { kategoriler: StorefrontCategory[] }) {
  const openDrawer = useCartStore((s) => s.openDrawer);
  const adet = useSepetAdedi();
  const account = useAuthStore((s) => s.account);
  const favoriler = useFavoriUidleri();
  const karsilastirma = useKarsilastirmaStore((s) => s.uidler);
  const favoriAdedi = favoriler.data?.length ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      {/* SATIR 1 — kimlik, arama, eylemler */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <MobilMenu kategoriler={kategoriler} />

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Ana sayfa">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Zap className="size-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">{SITE_ADI}</span>
        </Link>

        <div className="hidden shrink-0 md:block">
          <MegaMenu kategoriler={kategoriler} />
        </div>

        <div className="hidden flex-1 md:block">
          <Suspense>
            <Arama kategoriler={kategoriler} />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <IkonBaglanti href="/favoriler" etiket="Favoriler" rozet={favoriAdedi}>
            <Heart className="size-5" />
          </IkonBaglanti>
          <IkonBaglanti href="/karsilastir" etiket="Karşılaştır" rozet={karsilastirma.length}>
            <BarChart3 className="size-5" />
          </IkonBaglanti>
          <HesapMenusu />
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Sepeti aç"
            className="relative flex size-10 items-center justify-center rounded-lg text-soft transition hover:bg-background hover:text-foreground"
          >
            <ShoppingBag className="size-5" />
            {adet > 0 ? (
              <span className="absolute right-0 top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-price px-1 text-[10px] font-bold text-white">
                {adet > 9 ? "9+" : adet}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* SATIR 2 — gezinme kısayolları (masaüstü) */}
      <div className="hidden border-t border-line md:block">
        <nav className="mx-auto flex h-10 max-w-7xl items-center gap-1 px-4 text-sm">
          <Kisayol href="/urunler" Icon={Store}>
            Tüm Ürünler
          </Kisayol>
          <Kisayol href="/koleksiyonlar" Icon={Sparkles}>
            Koleksiyonlar
          </Kisayol>
          <Kisayol href="/kategoriler" Icon={Package}>
            Kategori Rehberi
          </Kisayol>
          <Link
            href="/urunler?sirala=fiyat-artan"
            className="ml-auto rounded-lg bg-price/10 px-3 py-1.5 font-semibold text-price transition hover:bg-price/15"
          >
            En Uygun Fiyatlar
          </Link>
        </nav>
      </div>

      {/* Mobil arama — ayrı satır (başparmak erişimi) */}
      <div className="border-t border-line px-4 py-2 md:hidden">
        <Suspense>
          <Arama kategoriler={kategoriler} />
        </Suspense>
      </div>
    </header>
  );
}

function Kisayol({
  href,
  Icon,
  children,
}: {
  href: string;
  Icon: typeof Store;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-soft transition hover:bg-background hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </Link>
  );
}

/** İkon + sayaç rozeti. Sayaç 0 ise rozet çizilmez (boş rozet gürültüdür). */
function IkonBaglanti({
  href,
  etiket,
  rozet,
  children,
}: {
  href: string;
  etiket: string;
  rozet: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={etiket}
      title={etiket}
      className="relative hidden size-10 items-center justify-center rounded-lg text-soft transition hover:bg-background hover:text-foreground sm:flex"
    >
      {children}
      {rozet > 0 ? (
        <span className="absolute right-0 top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {rozet > 9 ? "9+" : rozet}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Hesap açılır menüsü. Girişsizken tek bağlantıdır (menü açmanın anlamı yok);
 * giriş yapılmışsa hesabın alt sayfaları ve çıkış buradan gezilir.
 */
function HesapMenusu() {
  const account = useAuthStore((s) => s.account);
  const signOut = useAuthStore((s) => s.signOut);
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const disari = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", disari);
    return () => document.removeEventListener("mousedown", disari);
  }, [acik]);

  if (!account) {
    return (
      <Link
        href="/hesap"
        className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-soft transition hover:bg-background hover:text-foreground"
      >
        <User className="size-5" />
        <span className="hidden lg:inline">Giriş Yap</span>
      </Link>
    );
  }

  return (
    <div ref={kutu} className="relative">
      <button
        type="button"
        aria-expanded={acik}
        onClick={() => setAcik((a) => !a)}
        className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-soft transition hover:bg-background hover:text-foreground"
      >
        <User className="size-5" />
        <span className="hidden max-w-24 truncate lg:inline">
          {(account.fullName || account.email).split(" ")[0]}
        </span>
      </button>
      {acik ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/10 dark:shadow-black/60">
          <p className="truncate px-3 py-2 text-xs text-soft">{account.email}</p>
          <MenuBaglantisi href="/hesap" onTikla={() => setAcik(false)}>
            Hesabım
          </MenuBaglantisi>
          <MenuBaglantisi href="/hesap?sekme=siparisler" onTikla={() => setAcik(false)}>
            Siparişlerim
          </MenuBaglantisi>
          <MenuBaglantisi href="/favoriler" onTikla={() => setAcik(false)}>
            Favorilerim
          </MenuBaglantisi>
          <MenuBaglantisi href="/hesap?sekme=adresler" onTikla={() => setAcik(false)}>
            Adreslerim
          </MenuBaglantisi>
          <button
            type="button"
            onClick={() => {
              signOut();
              setAcik(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger transition hover:bg-background"
          >
            <LogOut className="size-4" aria-hidden />
            Çıkış Yap
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuBaglantisi({
  href,
  onTikla,
  children,
}: {
  href: string;
  onTikla: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onTikla}
      className="block rounded-lg px-3 py-2 text-sm transition hover:bg-background"
    >
      {children}
    </Link>
  );
}
