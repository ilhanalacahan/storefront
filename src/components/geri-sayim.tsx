"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * GERİ SAYIM — kampanyanın bitişine kalan süre.
 *
 * Bitiş anı SUNUCUDAN gelir (cms_banner.ends_at); vitrin uydurmaz. Süre
 * dolduğunda bileşen kendini gizler: "00:00:00" gösteren bir sayaç, biten
 * kampanyayı yaşatmaya çalışan bir yalandır — banner'ın kendisi de bir
 * sonraki ISR tazelemesinde listeden düşer.
 *
 * İLK RENDER SUNUCUDA BOŞTUR: kalan süre `new Date()`e bağlıdır ve sunucu ile
 * tarayıcının saati aynı milisaniyede değildir; doğrudan hesaplamak hidrasyon
 * uyuşmazlığı üretirdi.
 */
export function GeriSayim({ bitis, sade = false }: { bitis: string; sade?: boolean }) {
  const [kalan, setKalan] = useState<number | null>(null);

  useEffect(() => {
    const hedef = new Date(bitis).getTime();
    if (Number.isNaN(hedef)) return;
    const guncelle = () => setKalan(hedef - Date.now());
    guncelle();
    const t = setInterval(guncelle, 1000);
    return () => clearInterval(t);
  }, [bitis]);

  if (kalan === null || kalan <= 0) return null;

  const saniye = Math.floor(kalan / 1000);
  const gun = Math.floor(saniye / 86400);
  const saat = Math.floor((saniye % 86400) / 3600);
  const dakika = Math.floor((saniye % 3600) / 60);
  const sn = saniye % 60;

  if (sade) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-price">
        <Timer className="size-3.5" aria-hidden />
        {gun > 0 ? `${gun}g ` : ""}
        {iki(saat)}:{iki(dakika)}:{iki(sn)}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Timer className="size-4 opacity-80" aria-hidden />
      <div className="flex gap-1.5">
        {gun > 0 ? <Kutu deger={gun} birim="gün" /> : null}
        <Kutu deger={saat} birim="saat" />
        <Kutu deger={dakika} birim="dk" />
        <Kutu deger={sn} birim="sn" />
      </div>
    </div>
  );
}

function iki(n: number): string {
  return String(n).padStart(2, "0");
}

function Kutu({ deger, birim }: { deger: number; birim: string }) {
  return (
    <span className="flex min-w-11 flex-col items-center rounded-lg bg-black/20 px-2 py-1 backdrop-blur">
      <span className="text-base font-bold leading-none tabular-nums">{iki(deger)}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{birim}</span>
    </span>
  );
}
