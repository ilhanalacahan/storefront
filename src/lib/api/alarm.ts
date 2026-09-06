import { apiIstemci, sorgu } from "./client";

/**
 * ÜRÜN ALARMLARI — "gelince haber ver" / "düşünce haber ver".
 *
 * Üçü de vitrin oturumu ister: alarm bir e-posta taahhüdüdür.
 *
 * TEK ATIŞLIKTIR: haber verildikten sonra alarm tüketilir (`notifiedAt` dolar)
 * ve bir daha tetiklenmez; müşteri isterse yeniden kurar. Fiyat alarmının
 * referansı sunucuda damgalıdır ve GÖSTERİLMEZ — ham ölçekte tutulur, vitrin
 * yalnız "alarm kurulu" der (bkz. TicariCore service/storefront_alarm.go).
 */

export const ALARM_TURU = {
  Stok: 0,
  Fiyat: 1,
} as const;

export interface UrunAlarmi {
  uid: string;
  productUid: string;
  name: string;
  handle: string;
  imageUrl: string;
  /** 0 stok · 1 fiyat. */
  kind: number;
  /** Fiyat alarmının referansı kurulu mu (değerin kendisi taşınmaz). */
  hasBasePrice: boolean;
  curCode: number;
  createdAt: string;
  /** '' = hâlâ bekliyor. */
  notifiedAt: string;
}

export async function alarmlariGetir(token: string): Promise<UrunAlarmi[]> {
  const d = await apiIstemci<{ alerts: UrunAlarmi[] }>("/account/alerts", { token });
  return d.alerts ?? [];
}

export async function alarmKur(
  productUid: string,
  kind: number,
  token: string,
): Promise<UrunAlarmi> {
  return apiIstemci<UrunAlarmi>(`/products/${encodeURIComponent(productUid)}/alerts`, {
    metot: "POST",
    govde: { kind },
    token,
  });
}

export async function alarmSil(productUid: string, kind: number, token: string): Promise<void> {
  await apiIstemci<void>(
    `/products/${encodeURIComponent(productUid)}/alerts${sorgu({ kind })}`,
    { metot: "DELETE", token },
  );
}
