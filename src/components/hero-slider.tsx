"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { GeriSayim } from "@/components/geri-sayim";
import type { StorefrontBanner } from "@/lib/api/cms";

/** Otomatik geçiş süresi (ms). */
const GECIS = 6000;

/**
 * HERO SLIDER — CMS'ten gelen hero banner'ları (kind=1) sırayla gösterir.
 *
 * Tek banner varsa OK VE NOKTA ÇİZİLMEZ ve zamanlayıcı hiç kurulmaz: tek
 * kareli bir slider, kullanıcıya tıklayacak bir şey varmış gibi görünen ölü
 * bir arayüzdür.
 *
 * ERİŞİLEBİLİRLİK: fare panelin üzerindeyken otomatik geçiş DURUR — okumakta
 * olan kullanıcının altından kareyi çekmek, en sık şikâyet edilen slider
 * davranışıdır. `prefers-reduced-motion` açıksa otomatik geçiş hiç başlamaz.
 */
export function HeroSlider({ herolar }: { herolar: StorefrontBanner[] }) {
  const [indeks, setIndeks] = useState(0);
  const [durdu, setDurdu] = useState(false);
  const adet = herolar.length;

  const git = useCallback(
    (n: number) => setIndeks((i) => (adet ? (i + n + adet) % adet : 0)),
    [adet],
  );

  useEffect(() => {
    if (adet < 2 || durdu) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const t = setInterval(() => git(1), GECIS);
    return () => clearInterval(t);
  }, [adet, durdu, git]);

  if (!adet) return null;
  const aktif = herolar[Math.min(indeks, adet - 1)];

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent to-indigo-700 text-white"
      onMouseEnter={() => setDurdu(true)}
      onMouseLeave={() => setDurdu(false)}
      aria-roledescription="carousel"
      aria-label="Kampanya duyuruları"
    >
      <div className="grid items-center gap-6 px-6 py-12 md:grid-cols-2 md:px-12 md:py-16">
        <div className="relative z-10 max-w-xl space-y-4">
          {aktif.subtitle ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
              {aktif.subtitle}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">{aktif.title}</h1>
          {aktif.body ? <p className="whitespace-pre-line text-white/80">{aktif.body}</p> : null}
          {aktif.endsAt ? <GeriSayim bitis={aktif.endsAt} /> : null}
          {aktif.linkUrl ? (
            <Link
              href={aktif.linkUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-accent transition hover:bg-white/90"
            >
              {aktif.linkLabel || "Keşfet"} <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
        {aktif.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- CMS görseli; boyut bilinmiyor
          <img
            src={aktif.imageUrl}
            alt={aktif.title}
            className="relative z-10 max-h-72 w-full rounded-2xl object-cover shadow-2xl shadow-black/30"
          />
        ) : null}
      </div>

      {adet > 1 ? (
        <>
          <button
            type="button"
            aria-label="Önceki"
            onClick={() => git(-1)}
            className="absolute left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur transition hover:bg-black/40 md:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Sonraki"
            onClick={() => git(1)}
            className="absolute right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur transition hover:bg-black/40 md:flex"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {herolar.map((h, i) => (
              <button
                key={h.uid}
                type="button"
                aria-label={`${i + 1}. duyuru`}
                aria-current={i === indeks}
                onClick={() => setIndeks(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === indeks ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-24 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
    </section>
  );
}
