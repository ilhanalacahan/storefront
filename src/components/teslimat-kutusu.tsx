import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

import { fiyat } from "@/lib/format";
import type { ShippingMethod } from "@/lib/api/types";

/**
 * TESLİMAT VE İADE KUTUSU — ürün sayfasındaki "ne zaman gelir, kaça gelir"
 * cevabı.
 *
 * ÜCRET TARİFEDEN GELİR, SEPETTEN DEĞİL: ürün sayfasında henüz sepet yoktur,
 * bu yüzden gösterilen `listPrice` tarifedeki sabit ücrettir. Sepetteki gerçek
 * ücret (eşik uygulanmış hâli) yine sepet yanıtından okunur — burada
 * hesaplanmaz (G5).
 *
 * Ücretsiz kargo sınırı varsa BİLGİ olarak yazılır ("750 TL üzeri ücretsiz");
 * "şu kadar kaldı" cümlesi sepete aittir, çünkü kalan tutar sepetin matrahına
 * bağlıdır ve onu sunucu hesaplar.
 */
export function TeslimatKutusu({ yontemler }: { yontemler: ShippingMethod[] }) {
  const esikli = yontemler.filter((y) => y.freeOverSubtotal);

  return (
    <div className="space-y-4 text-sm">
      {yontemler.length ? (
        <div className="space-y-2">
          <p className="font-semibold">Teslimat seçenekleri</p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {yontemler.map((y) => (
              <li key={y.code} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex items-center gap-2">
                  <Truck className="size-4 text-soft" aria-hidden />
                  {y.name}
                </span>
                <span className="font-medium">
                  {Number(y.listPrice) > 0 ? fiyat(y.listPrice, 1) : "Ücretsiz"}
                </span>
              </li>
            ))}
          </ul>
          {esikli.length ? (
            <p className="text-soft">
              {esikli
                .map((y) => `${y.name}: ${fiyat(y.freeOverSubtotal, 1)} ve üzeri siparişlerde ücretsiz`)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <ul className="space-y-2.5">
        <Madde Icon={Package}>
          Siparişiniz stoktan çıkıyorsa aynı gün kargoya verilir; hazırlık süresi olan ürünlerde
          termin ürün sayfasında yazar.
        </Madde>
        <Madde Icon={RotateCcw}>
          Teslimden itibaren <strong>14 gün</strong> içinde koşulsuz cayma hakkınız vardır.
          Ayrıntılar{" "}
          <Link href="/sozlesmeler/iptal-iade" className="text-accent hover:underline">
            İptal ve İade Koşulları
          </Link>{" "}
          sayfasındadır.
        </Madde>
        <Madde Icon={ShieldCheck}>
          Ödemeler 3D Secure ile alınır; kart bilgileriniz mağazada saklanmaz.
        </Madde>
      </ul>
    </div>
  );
}

function Madde({ Icon, children }: { Icon: typeof Truck; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-soft">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
