"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * LİSTE SAYFASI DÜZENİ — solda facet paneli, sağda içerik.
 *
 * Panel PROP OLARAK GELİR (React düğümü): sunucuda çizilir, bu bileşen yalnız
 * yerleşimi ve MOBİL PANELİ yönetir. Paneli burada üretseydik facet'ler
 * istemciye inerdi ve süzgeç linkleri SEO botunun göremeyeceği bir yerde
 * kalırdı.
 *
 * Masaüstünde panel yapışkandır (uzun listede kaydırırken süzgeç kaybolmaz),
 * mobilde alttan açılan bir yaprak olur — ticari vitrinlerin standardı budur
 * ve sebebi basittir: dar ekranda 280 piksellik bir sütun içeriğe yer bırakmaz.
 */
export function KatalogDuzeni({
  panel,
  children,
}: {
  panel: React.ReactNode;
  children: React.ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();

  // Süzgeç seçilince adres değişir; yaprak kendiliğinden kapanmalı — açık
  // kalsaydı müşteri her seçimden sonra elle kapatmak zorunda kalırdı.
  useEffect(() => {
    setAcik(false);
  }, [pathname, params]);

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

  return (
    <div className="flex gap-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-4">
          {panel}
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold transition hover:border-accent lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtrele ve Sırala
        </button>
        {children}
      </div>

      {acik ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Filtreleri kapat"
            onClick={() => setAcik(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-surface">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-bold">Filtrele</span>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setAcik(false)}
                className="flex size-9 items-center justify-center rounded-lg text-soft transition hover:bg-background"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{panel}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
