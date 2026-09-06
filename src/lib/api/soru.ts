import { apiIstemci, sorgu } from "./client";

/**
 * ÜRÜN SORULARI — vitrin yüzeyi.
 *
 * Liste anonim okunur ama ÖNBELLEKLENMEZ ve istemciden çekilir: giriş yapmış
 * müşteri kendi sorularını (onay bekleyenler dahil) aynı yanıtta görür, yani
 * yanıt kişiye özeldir — yorum ucuyla aynı gerekçe (V5 kalıbı).
 *
 * Soru sormak vitrin oturumu ister; yazılan soru ONAYA DÜŞER ve mağaza
 * yayınlayana kadar başkalarına görünmez.
 */

export interface UrunSorusu {
  uid: string;
  body: string;
  /** Maskeli ad ("Ahmet Y."). */
  authorName: string;
  /** RFC3339 */
  createdAt: string;
  /** Mağaza yanıtı ('' = henüz yanıtlanmadı). */
  answer: string;
  answeredAt: string;
  /** Yalnız kendi sorularında anlamlı: 0 bekliyor · 1 yayında · 2 reddedildi. */
  status: number;
}

export interface UrunSoruListesi {
  questions: UrunSorusu[];
  total: number;
  /** Giriş yapmış müşterinin kendi soruları (onay bekleyenler dahil). */
  mine: UrunSorusu[];
}

export async function sorulariGetir(
  productUid: string,
  token?: string | null,
  limit = 10,
): Promise<UrunSoruListesi> {
  return apiIstemci<UrunSoruListesi>(
    `/products/${encodeURIComponent(productUid)}/questions${sorgu({ limit })}`,
    { token },
  );
}

export async function soruSor(
  productUid: string,
  body: string,
  token: string,
): Promise<UrunSorusu> {
  return apiIstemci<UrunSorusu>(`/products/${encodeURIComponent(productUid)}/questions`, {
    metot: "POST",
    govde: { body },
    token,
  });
}
