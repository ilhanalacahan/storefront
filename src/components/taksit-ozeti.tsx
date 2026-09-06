"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, CreditCard } from "lucide-react";
import { useState } from "react";

import { TaksitTablosu } from "@/components/taksit-tablosu";
import { taksitleriGetirCanli } from "@/lib/api/taksit";
import { fiyat } from "@/lib/format";

/**
 * ÖDEME ÖZETİNDEKİ TAKSİT KUTUSU — sepetin GENEL TOPLAMINA göre.
 *
 * Tablo istemcide çekilir çünkü tutar sepetle birlikte değişir (kargo seçimi,
 * kupon, miktar); sunucuda çizilen bir tablo ilk yüklemede donardı. Hesap yine
 * sunucudadır (G5) — burada yalnız hangi tutarın sorulacağı belirlenir.
 *
 * KAPALI BAŞLAR: checkout'un işi ödemeyi tamamlatmaktır; taksit tablosu
 * merak edene açılan bir ayrıntıdır. Tarife yoksa kutu hiç çizilmez.
 */
export function TaksitOzeti({ tutar, curCode }: { tutar: string; curCode: number }) {
  const [acik, setAcik] = useState(false);
  const { data } = useQuery({
    queryKey: ["taksit", tutar],
    queryFn: () => taksitleriGetirCanli(tutar),
    enabled: Number(tutar) > 0,
    staleTime: 300_000,
  });
  const bankalar = data ?? [];
  if (!bankalar.length) return null;

  // "En düşük aylık" bilgisi SUNUCUDAN GELEN değerlerden SEÇİLİR, hesaplanmaz:
  // karşılaştırma yapmak parasal aritmetik değildir, bölme olurdu.
  const enDusuk = bankalar
    .flatMap((b) => b.options)
    .filter((o) => o.count > 1)
    .reduce<{ monthly: string; count: number } | null>((az, o) => {
      if (!az || Number(o.monthly) < Number(az.monthly)) return { monthly: o.monthly, count: o.count };
      return az;
    }, null);

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        className="flex w-full items-center justify-between gap-2 text-left text-sm"
      >
        <span className="flex items-center gap-2">
          <CreditCard className="size-4 text-accent" aria-hidden />
          {enDusuk ? (
            <span>
              <strong>{enDusuk.count} taksit</strong> ile aylık{" "}
              <strong className="text-price">{fiyat(enDusuk.monthly, curCode)}</strong>
            </span>
          ) : (
            <span>Taksit seçenekleri</span>
          )}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-soft transition ${acik ? "rotate-180" : ""}`} />
      </button>
      {acik ? (
        <div className="mt-3">
          <TaksitTablosu bankalar={bankalar} curCode={curCode} baslik="" />
        </div>
      ) : null}
    </div>
  );
}
