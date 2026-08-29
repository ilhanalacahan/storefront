"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Cart } from "@/lib/api/types";
import { fiyat, miktar } from "@/lib/format";

/**
 * ÖDEME ONAY KUTULARI — mesafeli satışın zorunlu adımı.
 *
 * Mevzuat, alıcının ödeme yükümlülüğü altına girmeden ÖNCE ön bilgilendirmeyi
 * ve sözleşmeyi okuyup onaylamasını ister. İki ayrı onay kutusu bilinçlidir:
 * tek kutuya iki belgeyi sıkıştırmak, hangisinin onaylandığını belirsiz bırakır.
 *
 * ÖZET BURADA GÖSTERİLİR: sözleşme sayfaları geneldir; yönetmelik ise
 * bilgilendirmenin O SİPARİŞE ait olmasını (ürünler, tutar, kargo, teslimat
 * adresi) ister. "Sipariş özetini gör" bağlantısı bu boşluğu kapatır —
 * müşteri, onayladığı şeyin kendi siparişi olduğunu görür.
 *
 * ONAY DURUMU SAKLANMAZ: her ödeme denemesinde yeniden istenir. Bir kez
 * onaylayıp sonsuza kadar geçerli saymak, sözleşmenin o siparişe ait olması
 * kuralını kırardı.
 */
export function SozlesmeOnayi({
  sepet,
  onayli,
  onChange,
}: {
  sepet: Cart;
  onayli: boolean;
  onChange: (v: boolean) => void;
}) {
  const [ozetAcik, setOzetAcik] = useState(false);
  const [bilgilendirme, setBilgilendirme] = useState(false);
  const [sozlesme, setSozlesme] = useState(false);

  const guncelle = (b: boolean, s: boolean) => {
    setBilgilendirme(b);
    setSozlesme(s);
    onChange(b && s);
  };

  return (
    <div className="space-y-2.5">
      <Kutu
        isaretli={bilgilendirme}
        onChange={(v) => guncelle(v, sozlesme)}
        id="onay-bilgilendirme"
      >
        <Link
          href="/sozlesmeler/on-bilgilendirme"
          target="_blank"
          className="font-medium text-accent hover:underline"
        >
          Ön Bilgilendirme Formu
        </Link>
        &apos;nu okudum, bilgilendirildim.
      </Kutu>

      <Kutu isaretli={sozlesme} onChange={(v) => guncelle(bilgilendirme, v)} id="onay-sozlesme">
        <Link
          href="/sozlesmeler/mesafeli-satis"
          target="_blank"
          className="font-medium text-accent hover:underline"
        >
          Mesafeli Satış Sözleşmesi
        </Link>
        &apos;ni okudum ve kabul ediyorum.
      </Kutu>

      <button
        type="button"
        onClick={() => setOzetAcik(true)}
        className="text-xs text-soft underline underline-offset-2 hover:text-foreground"
      >
        Onayladığım sipariş özetini gör
      </button>

      {!onayli ? (
        <p className="text-xs text-soft">
          Ödemeye geçmek için iki onayı da işaretleyin.
        </p>
      ) : null}

      {ozetAcik ? <OzetDiyalogu sepet={sepet} kapat={() => setOzetAcik(false)} /> : null}
    </div>
  );
}

function Kutu({
  id,
  isaretli,
  onChange,
  children,
}: {
  id: string;
  isaretli: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={isaretli}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
      />
      <span className="text-soft">{children}</span>
    </label>
  );
}

/**
 * Sipariş özeti — ön bilgilendirmenin "bu siparişe ait" kısmı.
 * Tutarlar SUNUCUNUN hesabıdır; burada yalnız biçimlenir (G5).
 */
function OzetDiyalogu({ sepet, kapat }: { sepet: Cart; kapat: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sipariş özeti"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={kapat}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Sipariş Özeti</h2>
            <p className="text-xs text-soft">
              Onayladığınız ön bilgilendirmenin siparişinize ait kısmı.
            </p>
          </div>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="rounded-lg p-1 text-soft hover:bg-background"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="space-y-2 border-b border-line pb-3">
          {sepet.lines.map((l) => (
            <li key={l.productUid} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{l.name}</span>
                <span className="text-xs text-soft">
                  {miktar(l.quantity)} × {fiyat(l.grossUnitPrice, sepet.curCode)} (KDV dahil)
                </span>
              </span>
              <span className="shrink-0 font-medium">{fiyat(l.lineTotal, sepet.curCode)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1.5 py-3 text-sm">
          <Satir ad="Ara toplam (KDV hariç)" deger={fiyat(sepet.subTotal, sepet.curCode)} />
          {Number(sepet.discountTotal) > 0 ? (
            <Satir
              ad={`İndirim${sepet.promotionName ? ` — ${sepet.promotionName}` : ""}`}
              deger={`−${fiyat(sepet.discountTotal, sepet.curCode)}`}
            />
          ) : null}
          <Satir ad="KDV" deger={fiyat(sepet.taxTotal, sepet.curCode)} />
          <Satir
            ad="Kargo"
            deger={
              Number(sepet.shippingFee) > 0
                ? fiyat(sepet.shippingFee, sepet.curCode)
                : "Ücretsiz"
            }
          />
          <div className="flex justify-between gap-3 border-t border-line pt-2 font-bold">
            <dt>Ödenecek Tutar</dt>
            <dd>{fiyat(sepet.grandTotal, sepet.curCode)}</dd>
          </div>
        </dl>

        {sepet.shipAddress ? (
          <div className="border-t border-line pt-3 text-sm">
            <p className="font-medium">Teslimat Adresi</p>
            <p className="mt-1 text-soft">
              {sepet.shipName}
              <br />
              {sepet.shipAddress}
              <br />
              {sepet.shipDistrict ? `${sepet.shipDistrict}, ` : ""}
              {sepet.shipCity}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Satir({ ad, deger }: { ad: string; deger: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-soft">{ad}</dt>
      <dd>{deger}</dd>
    </div>
  );
}
