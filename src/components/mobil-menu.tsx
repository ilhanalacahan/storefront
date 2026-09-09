"use client";

import { ChevronDown, LogIn, Menu, PackageSearch, Sparkles, Store, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { StorefrontCategory } from "@/lib/api/catalog";
import { kategoriAgaci, kategoriYolu, type KategoriDugumu } from "@/lib/kategori";
import { BELGE_ADLARI } from "@/lib/sozlesmeler";
import { useAuthStore } from "@/store/auth-store";

/**
 * MOBİL ÇEKMECE MENÜ — hamburger düğmesi + soldan açılan panel.
 *
 * Kategori ağacı burada AKORDEONDUR: mobil ekranda mega menünün sütunları
 * sığmaz, üç seviyeyi ayrı sayfalara bölmek de her dokunuşta yeni bir yükleme
 * demekti. Akordeon ağacı tek ekranda, tek durumda tutar.
 *
 * Panel açıkken sayfa kaydırması KİLİTLENİR: arkadaki liste kayarsa müşteri
 * menüyü kapattığında nerede olduğunu kaybeder.
 */
export function MobilMenu({ kategoriler }: { kategoriler: StorefrontCategory[] }) {
  const [acik, setAcik] = useState(false);
  const agac = kategoriAgaci(kategoriler);
  const hesap = useAuthStore((s) => s.account);

  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    document.addEventListener("keydown", kapat);
    return () => {
      document.body.style.overflow = eski;
      document.removeEventListener("keydown", kapat);
    };
  }, [acik]);

  const kapat = () => setAcik(false);

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü aç"
        onClick={() => setAcik(true)}
        className="flex size-10 items-center justify-center rounded-lg text-foreground transition hover:bg-background md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {acik ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={kapat}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-surface shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="flex items-center gap-2 font-bold">
                <Store className="size-4 text-accent" aria-hidden />
                Menü
              </span>
              <button
                type="button"
                aria-label="Kapat"
                onClick={kapat}
                className="flex size-9 items-center justify-center rounded-lg text-soft transition hover:bg-background"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="border-b border-line p-3">
                <Link
                  href="/hesap"
                  onClick={kapat}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground"
                >
                  <LogIn className="size-4" aria-hidden />
                  {hesap ? (hesap.fullName || hesap.email) : "Giriş Yap / Üye Ol"}
                </Link>
              </div>

              <nav className="p-2">
                <Kisayol href="/urunler" etiket="Tüm Ürünler" onTikla={kapat} Icon={Store} />
                <Kisayol href="/koleksiyonlar" etiket="Koleksiyonlar" onTikla={kapat} Icon={Sparkles} />
                <Kisayol
                  href="/siparis-sorgula"
                  etiket="Sipariş Sorgula"
                  onTikla={kapat}
                  Icon={PackageSearch}
                />
              </nav>

              {agac.length ? (
                <div className="border-t border-line p-2">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-soft">
                    Kategoriler
                  </p>
                  {agac.map((k) => (
                    <Dal key={k.uid} dugum={k} onGezinti={kapat} />
                  ))}
                </div>
              ) : null}

              <div className="border-t border-line p-2 pb-8">
                <Link
                  href="/sozlesmeler/iptal-iade"
                  onClick={kapat}
                  className="block rounded-lg px-3 py-2 text-sm text-soft transition hover:bg-background hover:text-foreground"
                >
                  {BELGE_ADLARI["iptal-iade"]}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Kisayol({
  href,
  etiket,
  onTikla,
  Icon,
}: {
  href: string;
  etiket: string;
  onTikla: () => void;
  Icon: typeof Store;
}) {
  return (
    <Link
      href={href}
      onClick={onTikla}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-background"
    >
      <Icon className="size-4 text-soft" aria-hidden />
      {etiket}
    </Link>
  );
}

/** Tek kategori dalı — çocuğu varsa akordeon, yoksa düz bağlantı. */
function Dal({ dugum, onGezinti }: { dugum: KategoriDugumu; onGezinti: () => void }) {
  const [acik, setAcik] = useState(false);
  if (!dugum.cocuklar.length) {
    return (
      <Link
        href={kategoriYolu(dugum)}
        onClick={onGezinti}
        className="block rounded-lg px-3 py-2.5 text-sm transition hover:bg-background"
      >
        {dugum.name}
      </Link>
    );
  }
  return (
    <div>
      <div className="flex items-center">
        <Link
          href={kategoriYolu(dugum)}
          onClick={onGezinti}
          className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-background"
        >
          {dugum.name}
        </Link>
        <button
          type="button"
          aria-label={`${dugum.name} alt kategorileri`}
          aria-expanded={acik}
          onClick={() => setAcik((a) => !a)}
          className="flex size-9 items-center justify-center rounded-lg text-soft transition hover:bg-background"
        >
          <ChevronDown className={`size-4 transition ${acik ? "rotate-180" : ""}`} />
        </button>
      </div>
      {acik ? (
        <div className="ml-3 border-l border-line pl-2">
          {dugum.cocuklar.map((c) => (
            <Dal key={c.uid} dugum={c} onGezinti={onGezinti} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
