"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * YATAY ŞERİT — ürün/kategori carousel'lerinin ortak kabuğu.
 *
 * İÇERİK PROP OLARAK GELİR (children): kartlar sunucuda çizilir, şerit yalnız
 * kaydırma düğmelerini ekler. Kartları bu bileşenin İÇİNDE üretseydik ürün
 * kartı da istemci bileşeni olurdu ve ana sayfadaki onlarca kart tarayıcıya
 * inerdi.
 *
 * Kaydırma CSS'tir (.serit — globals.css); düğmeler yalnız gerektiğinde
 * çizilir ve kenara gelindiğinde sönümlenir. Dokunmatikte parmakla kaydırma
 * her zaman çalışır.
 */
export function Serit({
  baslik,
  altBaslik,
  tumuHref,
  tumuEtiketi = "Tümünü Gör",
  children,
}: {
  baslik?: string;
  altBaslik?: string;
  tumuHref?: string;
  tumuEtiketi?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [solVar, setSolVar] = useState(false);
  const [sagVar, setSagVar] = useState(false);

  const olc = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setSolVar(el.scrollLeft > 8);
    setSagVar(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    olc();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", olc, { passive: true });
    window.addEventListener("resize", olc);
    return () => {
      el.removeEventListener("scroll", olc);
      window.removeEventListener("resize", olc);
    };
  }, [olc]);

  const kaydir = (yon: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: yon * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      {baslik ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold md:text-xl">{baslik}</h2>
            {altBaslik ? <p className="text-sm text-soft">{altBaslik}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            {tumuHref ? (
              <Link
                href={tumuHref}
                className="mr-1 text-sm font-medium text-accent hover:underline"
              >
                {tumuEtiketi}
              </Link>
            ) : null}
            <OkDugmesi yon="sol" pasif={!solVar} onTikla={() => kaydir(-1)} />
            <OkDugmesi yon="sag" pasif={!sagVar} onTikla={() => kaydir(1)} />
          </div>
        </div>
      ) : null}
      <div ref={ref} className="serit -mx-1 px-1 pb-1">
        {children}
      </div>
    </section>
  );
}

function OkDugmesi({
  yon,
  pasif,
  onTikla,
}: {
  yon: "sol" | "sag";
  pasif: boolean;
  onTikla: () => void;
}) {
  const Icon = yon === "sol" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={yon === "sol" ? "Geri kaydır" : "İleri kaydır"}
      disabled={pasif}
      onClick={onTikla}
      className="hidden size-9 items-center justify-center rounded-full border border-line bg-surface text-soft transition hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-soft md:flex"
    >
      <Icon className="size-4" />
    </button>
  );
}
