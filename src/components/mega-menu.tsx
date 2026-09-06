"use client";

import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { StorefrontCategory } from "@/lib/api/catalog";
import { kategoriAgaci, kategoriYolu, type KategoriDugumu } from "@/lib/kategori";

/**
 * MEGA MENÜ — masaüstünde tam genişlikte açılan kategori paneli.
 *
 * Eski CSS-only açılır menünün yerini alır. Fark davranışsaldır: kök kategori
 * ÜZERİNE GELİNCE sağ panel o kökün alt ağacını gösterir, yani üç seviye tek
 * ekranda gezilir. Eski menüde ikinci seviye sütunlara sığdığı kadar
 * görünüyordu; derin kataloglarda (elektronik, yapı market) menü ya taşıyor ya
 * da kırpılıyordu.
 *
 * SEÇİM BİR DURUMDUR, ADRES DEĞİL: panel yalnız gezinme yardımıdır, gerçek
 * gezinme linklerle olur. Bu yüzden hover durumu bileşende tutulur ama URL'e
 * hiç yazılmaz.
 *
 * ERİŞİLEBİLİRLİK: panel focus-within ile de açılır, Escape kapatır ve dışarı
 * tıklama kapatır — fare olmadan da gezilebilir.
 */
export function MegaMenu({ kategoriler }: { kategoriler: StorefrontCategory[] }) {
  const agac = kategoriAgaci(kategoriler);
  const [acik, setAcik] = useState(false);
  const [odak, setOdak] = useState(0);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    const disari = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("keydown", kapat);
    document.addEventListener("mousedown", disari);
    return () => {
      document.removeEventListener("keydown", kapat);
      document.removeEventListener("mousedown", disari);
    };
  }, [acik]);

  if (!agac.length) return null;
  const secili = agac[Math.min(odak, agac.length - 1)];

  return (
    <div
      ref={kutu}
      className="relative"
      onMouseEnter={() => setAcik(true)}
      onMouseLeave={() => setAcik(false)}
    >
      <button
        type="button"
        aria-expanded={acik}
        onClick={() => setAcik((a) => !a)}
        className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
          acik ? "bg-accent text-accent-foreground" : "bg-background text-foreground hover:bg-line/60"
        }`}
      >
        <LayoutGrid className="size-4" aria-hidden />
        Kategoriler
        <ChevronDown className={`size-3.5 transition ${acik ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {acik ? (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="flex max-h-[70vh] w-[56rem] max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/10 dark:shadow-black/60">
            {/* Sol ray: kök kategoriler */}
            <ul className="w-56 shrink-0 overflow-y-auto border-r border-line bg-background/60 py-2">
              {agac.map((k, i) => (
                <li key={k.uid}>
                  <Link
                    href={kategoriYolu(k)}
                    onMouseEnter={() => setOdak(i)}
                    onFocus={() => setOdak(i)}
                    className={`flex items-center justify-between gap-2 px-4 py-2 text-sm transition ${
                      i === odak
                        ? "bg-surface font-semibold text-accent"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    <span className="truncate">{k.name}</span>
                    {k.cocuklar.length ? <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden /> : null}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Sağ panel: seçili kökün alt ağacı + görseli */}
            <div className="flex min-w-0 flex-1 gap-6 overflow-y-auto p-5">
              <div className="min-w-0 flex-1">
                <Link href={kategoriYolu(secili)} className="text-sm font-bold hover:text-accent">
                  {secili.name}
                  <span className="ml-1.5 text-xs font-normal text-soft">
                    ({secili.productCount} ürün)
                  </span>
                </Link>
                {secili.cocuklar.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
                    {secili.cocuklar.map((c) => (
                      <AltSutun key={c.uid} kategori={c} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-soft">
                    Bu kategoride alt kırılım yok — doğrudan ürünleri görün.
                  </p>
                )}
              </div>

              {secili.imageUrl ? (
                <Link href={kategoriYolu(secili)} className="hidden w-48 shrink-0 lg:block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- kategori görseli; boyut bilinmiyor */}
                  <img
                    src={secili.imageUrl}
                    alt={secili.name}
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** İkinci seviye başlık + üçüncü seviye bağlantıları. */
function AltSutun({ kategori }: { kategori: KategoriDugumu }) {
  return (
    <div className="min-w-0 space-y-1">
      <Link href={kategoriYolu(kategori)} className="block truncate text-sm font-semibold hover:text-accent">
        {kategori.name}
      </Link>
      {kategori.cocuklar.length ? (
        <ul className="space-y-0.5">
          {kategori.cocuklar.slice(0, 6).map((c) => (
            <li key={c.uid}>
              <Link
                href={kategoriYolu(c)}
                className="block truncate text-[13px] text-soft transition hover:text-foreground"
              >
                {c.name}
              </Link>
            </li>
          ))}
          {kategori.cocuklar.length > 6 ? (
            <li>
              <Link href={kategoriYolu(kategori)} className="text-xs font-medium text-accent hover:underline">
                Tümü ({kategori.cocuklar.length})
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
