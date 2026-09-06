"use client";

import { useState } from "react";

/**
 * ÜRÜN SEKMELERİ — açıklama · özellikler · teslimat · yorumlar.
 *
 * İçerik SUNUCUDA çizilir ve prop olarak gelir; sekme yalnız hangisinin
 * görüneceğini seçer. Gizlenen sekme DOM'da kalır: SEO botu ve "sayfada bul"
 * (Ctrl+F) tüm içeriği görür — sekmeye tıklamadan içeriği olmayan bir sayfa,
 * arama motoru için yarı boş bir sayfadır.
 *
 * Mobilde sekmeler yatay kaydırılır; başlıklar sığmadığında kırpılmaz.
 */
export interface UrunSekmesi {
  anahtar: string;
  etiket: string;
  /** Sekme başlığındaki sayı rozeti (yorum sayısı gibi); 0 ise çizilmez. */
  rozet?: number;
  icerik: React.ReactNode;
}

export function UrunSekmeleri({ sekmeler }: { sekmeler: UrunSekmesi[] }) {
  const [aktif, setAktif] = useState(sekmeler[0]?.anahtar ?? "");
  if (!sekmeler.length) return null;
  const secili = sekmeler.find((s) => s.anahtar === aktif) ?? sekmeler[0];

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="serit border-b border-line px-2" role="tablist">
        {sekmeler.map((s) => (
          <button
            key={s.anahtar}
            type="button"
            role="tab"
            id={`sekme-${s.anahtar}`}
            aria-selected={s.anahtar === secili.anahtar}
            aria-controls={`panel-${s.anahtar}`}
            onClick={() => setAktif(s.anahtar)}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              s.anahtar === secili.anahtar
                ? "border-accent text-accent"
                : "border-transparent text-soft hover:text-foreground"
            }`}
          >
            {s.etiket}
            {s.rozet ? (
              <span className="rounded-full bg-background px-1.5 text-xs font-medium text-soft">
                {s.rozet}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {sekmeler.map((s) => (
        <div
          key={s.anahtar}
          id={`panel-${s.anahtar}`}
          role="tabpanel"
          aria-labelledby={`sekme-${s.anahtar}`}
          hidden={s.anahtar !== secili.anahtar}
          className="p-5"
        >
          {s.icerik}
        </div>
      ))}
    </section>
  );
}
