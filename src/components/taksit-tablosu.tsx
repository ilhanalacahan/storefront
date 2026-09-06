import { CreditCard } from "lucide-react";

import type { TaksitBankasi } from "@/lib/api/taksit";
import { fiyat } from "@/lib/format";

/**
 * TAKSİT TABLOSU — banka × taksit × aylık tutar.
 *
 * TÜM SAYILAR SUNUCUDAN GELİR: aylık tutar, taksitli toplam ve vade farkı
 * hazır hesaplanmıştır (G5). Burada tek yapılan biçimlemedir.
 *
 * İLK TAKSİT AYRICA YAZILIR: kuruş kalanı ilk taksite eklenir, bu yüzden
 * "6 × 208,33 = 1.249,98" gibi bir tutarsızlık görünmez — tablo hem aylık
 * tutarı hem de farklıysa ilk taksiti söyler.
 *
 * Tarife yoksa bileşen hiç çizilmez.
 */
export function TaksitTablosu({
  bankalar,
  curCode,
  baslik = "Taksit Seçenekleri",
}: {
  bankalar: TaksitBankasi[];
  curCode: number;
  baslik?: string;
}) {
  if (!bankalar.length) return null;

  return (
    <div className="space-y-4">
      {baslik ? (
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="size-4 text-accent" aria-hidden />
          {baslik}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {bankalar.map((b) => (
          <div key={b.bankName} className="overflow-hidden rounded-xl border border-line">
            <p className="border-b border-line bg-background px-4 py-2 text-sm font-semibold">
              {b.bankName}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-soft">
                  <th className="px-4 py-1.5 text-left font-medium">Taksit</th>
                  <th className="px-4 py-1.5 text-right font-medium">Aylık</th>
                  <th className="px-4 py-1.5 text-right font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {b.options.map((o) => (
                  <tr key={o.count}>
                    <td className="px-4 py-2">
                      {o.count === 1 ? "Tek çekim" : `${o.count} taksit`}
                      {Number(o.rate) > 0 ? (
                        <span className="ml-1.5 text-xs text-soft">(+%{o.rate})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {o.count === 1 ? "—" : fiyat(o.monthly, curCode)}
                      {o.count > 1 && o.firstMonthly !== o.monthly ? (
                        <span className="block text-[11px] font-normal text-soft">
                          ilk taksit {fiyat(o.firstMonthly, curCode)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-right">{fiyat(o.total, curCode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <p className="text-xs text-soft">
        Tablodaki tutarlar kartınızın bankasıyla mağazamız arasındaki anlaşmaya göre
        hesaplanır; ödeme adımında bankanız farklı bir seçenek sunabilir.
      </p>
    </div>
  );
}
