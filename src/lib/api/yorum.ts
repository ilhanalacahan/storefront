import { apiIstemci } from "./client";
import type { ProductReview, ReviewInput, ReviewList, StorefrontProduct } from "./types";

/**
 * Yorum/puan ve favoriler — hepsi tarayıcıdan (proxy) çağrılır: yorum listesi
 * kişiye özel `mine` taşır (önbelleksiz), yazma ve favoriler oturum ister.
 * Yorum ONAYDAN SONRA yayınlanır; yazan "onay bekliyor" görür.
 */

export async function yorumlariGetir(
  productUid: string,
  token: string | null,
  limit = 10,
  offset = 0,
): Promise<ReviewList> {
  return apiIstemci<ReviewList>(
    `/products/${encodeURIComponent(productUid)}/reviews?limit=${limit}&offset=${offset}`,
    { token },
  );
}

export async function yorumYaz(
  productUid: string,
  girdi: ReviewInput,
  token: string,
): Promise<ProductReview> {
  return apiIstemci<ProductReview>(`/products/${encodeURIComponent(productUid)}/reviews`, {
    metot: "POST",
    govde: { rating: girdi.rating, title: girdi.title ?? "", body: girdi.body },
    token,
  });
}

export async function favoriUidleri(token: string): Promise<string[]> {
  const d = await apiIstemci<{ uids: string[] }>("/account/favorites/uids", { token });
  return d.uids;
}

export async function favoriler(token: string): Promise<StorefrontProduct[]> {
  const d = await apiIstemci<{ products: StorefrontProduct[] }>("/account/favorites", { token });
  return d.products;
}

/** Ekler ve güncel uid listesini döner. */
export async function favoriEkle(productUid: string, token: string): Promise<string[]> {
  const d = await apiIstemci<{ uids: string[] }>(
    `/account/favorites/${encodeURIComponent(productUid)}`,
    { metot: "PUT", token },
  );
  return d.uids;
}

/** Çıkarır ve güncel uid listesini döner. */
export async function favoriSil(productUid: string, token: string): Promise<string[]> {
  const d = await apiIstemci<{ uids: string[] }>(
    `/account/favorites/${encodeURIComponent(productUid)}`,
    { metot: "DELETE", token },
  );
  return d.uids;
}
