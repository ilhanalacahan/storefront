"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * SEKMELİ VİTRİN — "Öne Çıkanlar / Yeni Gelenler / Fırsatlar" blokları.
 *
 * İÇERİK SUNUCUDA ÇİZİLİR ve prop olarak gelir: her sekmenin ürün ızgarası
 * hazır React düğümüdür, sekme değişimi yalnız hangisinin görüneceğini seçer.
 * İstemcide veri çekilseydi ana sayfa açılışta üç ayrı istek atardı ve SEO
 * botu hiçbirini göremezdi.
 *
 * SEÇİLİ OLMAYAN SEKME DE DOM'DADIR (gizlenir): sekme değişince yeniden
 * çizim ve görsel yeniden yükleme olmaz.
 */
export interface VitrinSekmesi {
  anahtar: string;
  etiket: string;
  href?: string;
  icerik: React.ReactNode;
}

export function SekmeliVitrin({ sekmeler }: { sekmeler: VitrinSekmesi[] }) {
  const [aktif, setAktif] = useState(sekmeler[0]?.anahtar ?? "");
  if (!sekmeler.length) return null;
  const secili = sekmeler.find((s) => s.anahtar === aktif) ?? sekmeler[0];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line">
        <div className="flex flex-wrap gap-1" role="tablist">
          {sekmeler.map((s) => (
            <button
              key={s.anahtar}
              type="button"
              role="tab"
              aria-selected={s.anahtar === secili.anahtar}
              onClick={() => setAktif(s.anahtar)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                s.anahtar === secili.anahtar
                  ? "border-accent text-accent"
                  : "border-transparent text-soft hover:text-foreground"
              }`}
            >
              {s.etiket}
            </button>
          ))}
        </div>
        {secili.href ? (
          <Link href={secili.href} className="pb-2 text-sm font-medium text-accent hover:underline">
            Tümünü Gör
          </Link>
        ) : null}
      </div>

      {sekmeler.map((s) => (
        <div key={s.anahtar} hidden={s.anahtar !== secili.anahtar} role="tabpanel">
          {s.icerik}
        </div>
      ))}
    </section>
  );
}
