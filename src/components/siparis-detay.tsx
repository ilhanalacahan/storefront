"use client";

import { Printer } from "lucide-react";

import type { StorefrontOrderDetail, StorefrontOrderRequest } from "@/lib/api/account";
import { fiyat, miktar, ODEME_DURUM, SIPARIS_DURUM, tarih } from "@/lib/format";

const TESLIM_DURUM: Record<number, string> = { 0: "Hazırlanıyor", 1: "Kısmen gönderildi", 2: "Teslim edildi" };
export const TALEP_TURU: Record<number, string> = { 1: "İptal talebi", 2: "İade talebi" };
export const TALEP_DURUM: Record<number, string> = { 0: "İnceleniyor", 1: "Kabul edildi", 2: "Reddedildi" };

/**
 * Sipariş detay kartı — hesapsız sorgulama, hesap sayfası ve yazdırma
 * sayfası aynı gövdeyi kullanır. Yalnız GÖSTERİR: talep açma düğmeleri
 * hesap sayfasındadır (oturum ister).
 */
export function SiparisDetayKarti({
  detay,
  yazdirilabilir = false,
}: {
  detay: StorefrontOrderDetail;
  yazdirilabilir?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 print:border-0 print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-bold">{detay.docNum || detay.uid.slice(0, 8)}</p>
          <p className="text-sm text-soft">{tarih(detay.issueDate)}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-md bg-accent/10 px-2 py-1 text-accent">{SIPARIS_DURUM[detay.orderState] ?? detay.orderState}</span>
          <span className="rounded-md bg-success/10 px-2 py-1 text-success">{ODEME_DURUM[detay.paymentState] ?? detay.paymentState}</span>
          <span className="rounded-md bg-line px-2 py-1">{TESLIM_DURUM[detay.fulfillmentState] ?? detay.fulfillmentState}</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-soft">
          <tr>
            <th className="py-1">Ürün</th>
            <th className="py-1 text-right">Miktar</th>
            <th className="py-1 text-right">Birim</th>
            <th className="py-1 text-right">Tutar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {detay.lines.map((l, i) => (
            <tr key={l.productUid + i}>
              <td className="py-2">{l.name}</td>
              <td className="py-2 text-right">
                {miktar(l.quantity)} {l.unit}
              </td>
              <td className="py-2 text-right">{fiyat(l.unitPrice, detay.curCode)}</td>
              <td className="py-2 text-right font-medium">{fiyat(l.lineTotal, detay.curCode)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-sm">
          {Number(detay.shippingFee) > 0 ? (
            <tr>
              <td colSpan={3} className="pt-2 text-right text-soft">Kargo</td>
              <td className="pt-2 text-right">{fiyat(detay.shippingFee, detay.curCode)}</td>
            </tr>
          ) : null}
          <tr>
            <td colSpan={3} className="pt-1 text-right font-semibold">Genel Toplam</td>
            <td className="pt-1 text-right text-base font-bold">{fiyat(detay.total, detay.curCode)}</td>
          </tr>
        </tfoot>
      </table>

      {detay.shipperCompName || detay.trackingCode || detay.despatchAddress ? (
        <dl className="grid gap-1 border-t border-line pt-3 text-sm sm:grid-cols-2">
          {detay.shipperCompName ? (
            <div>
              <dt className="text-xs text-soft">Teslimat</dt>
              <dd>{detay.shipperCompName}</dd>
            </div>
          ) : null}
          {detay.trackingCode ? (
            <div>
              <dt className="text-xs text-soft">Takip No</dt>
              <dd className="font-mono">{detay.trackingCode}</dd>
            </div>
          ) : null}
          {detay.despatchAddress ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-soft">Teslimat adresi</dt>
              <dd>
                {detay.despatchName ? `${detay.despatchName} — ` : ""}
                {detay.despatchAddress}
                {detay.despatchCity ? `, ${detay.despatchCity}` : ""}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {detay.requests.length ? <TalepListesi talepler={detay.requests} /> : null}

      {yazdirilabilir ? (
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:border-accent print:hidden"
        >
          <Printer className="size-4" /> Yazdır / PDF olarak kaydet
        </button>
      ) : null}
    </div>
  );
}

export function TalepListesi({ talepler }: { talepler: StorefrontOrderRequest[] }) {
  return (
    <ul className="space-y-2 border-t border-line pt-3 text-sm">
      {talepler.map((t) => (
        <li key={t.uid} className="rounded-xl bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{TALEP_TURU[t.kind] ?? t.kind}</span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                t.status === 1 ? "bg-success/10 text-success" : t.status === 2 ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
              }`}
            >
              {TALEP_DURUM[t.status] ?? t.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-soft">
            {tarih(t.createdAt)} · {t.reason}
          </p>
          {t.decisionNote ? <p className="mt-1 text-xs">Mağaza notu: {t.decisionNote}</p> : null}
        </li>
      ))}
    </ul>
  );
}
