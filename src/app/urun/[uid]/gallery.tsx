"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/product-image";
import type { ProductImageItem } from "@/lib/api/types";

/**
 * GALERİ — büyük görsel + küçük seçiciler + büyüteç + tam ekran.
 *
 * BÜYÜTEÇ SAF CSS'TİR: fare konumu `transform-origin`e yazılır ve görsel
 * ölçeklenir; ayrı bir zoom görseli indirilmez. Ürün fotoğrafı zaten yüksek
 * çözünürlüklüdür, ikinci bir istek ağı boşuna meşgul ederdi.
 *
 * TAM EKRAN (lightbox) klavyeyle gezilir: ok tuşları görsel değiştirir,
 * Escape kapatır. Dokunmatikte küçük şerit zaten kaydırılabilir.
 *
 * Her görselin kendi alt metni vardır (ERP'deki alt_text; boşsa sunucu ürün
 * adını koyar) — ekran okuyucu "görsel 3" değil "yan görünüm" duyar.
 */
export function Gallery({ gorseller }: { gorseller: ProductImageItem[] }) {
  const [aktif, setAktif] = useState(0);
  const [tamEkran, setTamEkran] = useState(false);
  const [odak, setOdak] = useState<{ x: number; y: number } | null>(null);
  const secili = gorseller[aktif] ?? { url: "", alt: "" };
  const adet = gorseller.length;

  useEffect(() => {
    if (!tamEkran) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTamEkran(false);
      if (e.key === "ArrowRight") setAktif((i) => (i + 1) % adet);
      if (e.key === "ArrowLeft") setAktif((i) => (i - 1 + adet) % adet);
    };
    document.addEventListener("keydown", tus);
    return () => {
      document.body.style.overflow = eski;
      document.removeEventListener("keydown", tus);
    };
  }, [tamEkran, adet]);

  return (
    <div className="flex gap-3">
      {/* Küçük şerit — masaüstünde dikey, mobilde büyük görselin altında */}
      {adet > 1 ? (
        <div className="hidden max-h-[32rem] w-20 shrink-0 flex-col gap-2 overflow-y-auto lg:flex">
          {gorseller.map((g, i) => (
            <Kucuk key={g.url + i} g={g} i={i} aktif={aktif} setAktif={setAktif} />
          ))}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 space-y-3">
        <div
          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl border border-line bg-surface"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOdak({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            });
          }}
          onMouseLeave={() => setOdak(null)}
          onClick={() => setTamEkran(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setTamEkran(true);
          }}
          aria-label="Görseli büyüt"
        >
          <div
            className="size-full transition-transform duration-200"
            style={
              odak
                ? { transform: "scale(1.9)", transformOrigin: `${odak.x}% ${odak.y}%` }
                : undefined
            }
          >
            <ProductImage
              src={secili.url}
              alt={secili.alt}
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
          </div>
          <span className="pointer-events-none absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/80 text-soft opacity-0 backdrop-blur transition group-hover:opacity-100">
            <Expand className="size-4" />
          </span>
          {adet > 1 ? (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-surface/80 px-2 py-0.5 text-xs font-medium text-soft backdrop-blur">
              {aktif + 1} / {adet}
            </span>
          ) : null}
        </div>

        {adet > 1 ? (
          <div className="serit lg:hidden">
            {gorseller.map((g, i) => (
              <Kucuk key={g.url + i} g={g} i={i} aktif={aktif} setAktif={setAktif} />
            ))}
          </div>
        ) : null}
      </div>

      {tamEkran ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setTamEkran(false)}
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-6" />
          </button>
          {adet > 1 ? (
            <>
              <button
                type="button"
                aria-label="Önceki görsel"
                onClick={() => setAktif((i) => (i - 1 + adet) % adet)}
                className="absolute left-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Sonraki görsel"
                onClick={() => setAktif((i) => (i + 1) % adet)}
                className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}
          <div className="relative h-[80vh] w-full max-w-4xl">
            <ProductImage src={secili.url} alt={secili.alt} sizes="90vw" />
          </div>
          <p className="absolute bottom-6 text-sm text-white/70">
            {secili.alt} {adet > 1 ? `· ${aktif + 1} / ${adet}` : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Kucuk({
  g,
  i,
  aktif,
  setAktif,
}: {
  g: ProductImageItem;
  i: number;
  aktif: number;
  setAktif: (n: number) => void;
}) {
  return (
    <button
      type="button"
      aria-label={g.alt || `Görsel ${i + 1}`}
      aria-pressed={i === aktif}
      onClick={() => setAktif(i)}
      onMouseEnter={() => setAktif(i)}
      className={`relative size-16 shrink-0 overflow-hidden rounded-xl border transition lg:size-20 ${
        i === aktif ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-soft"
      }`}
    >
      <ProductImage src={g.url} alt="" sizes="80px" />
    </button>
  );
}
