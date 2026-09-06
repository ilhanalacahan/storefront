import { apiIstemci, apiSunucu } from "./client";
import type { Cart, CartAddressInput, ShippingMethod } from "./types";

/**
 * Sepet işlemleri — hepsi tarayıcıdan, proxy üzerinden.
 *
 * SEPET KİMLİĞİ: backend'de ayrı bir "cart token" yoktur; sepetin uid'i
 * yetki anahtarıdır (bilen okur/yazar). Misafir sepetinin uid'i tarayıcıda
 * saklanır (store/cart-store.ts) ve YOLA girer. Müşteri giriş yapınca
 * sepetBirlestir misafir sepetini hesaba taşır.
 *
 * SEPET DONMASI: ödeme başlatıldıysa (odemeBaslat) sepet mutasyonları
 * backend'ce reddedilir; önce ödemeyi iptal etmek (odemeIptal) gerekir.
 *
 * Metot seçimi anlamlıdır: satır EKLEME toplar (POST), satır YAZMA mutlaktır
 * (PUT), kupon kaldırma silmedir (DELETE).
 */

const yol = (uid: string, ek = "") => `/carts/${encodeURIComponent(uid)}${ek}`;

export async function sepetGetir(uid: string, token?: string | null): Promise<Cart | null> {
  try {
    return await apiIstemci<Cart>(yol(uid), { token });
  } catch {
    // Silinmiş/tamamlanmış sepet 404'tür; vitrin bunu "sepet yok"a çevirir.
    return null;
  }
}

/** Giriş yapmış müşterinin açık sepeti (yoksa null) — sekmeler arası devir için. */
export async function mevcutSepet(token: string): Promise<Cart | null> {
  const d = await apiIstemci<Cart | { cart: null }>("/carts/current", { token });
  return "uid" in d ? d : null;
}

/** Sepete giden parametre değeri (şerit boyu gibi). */
export interface SepetParametreGirdisi {
  key: string;
  value: number;
}

/**
 * Satır ekler; cartUid '' ise YENİ sepet açar (dönen sepetin uid'ini saklayın).
 * params doluysa aynı ürünün farklı ölçüsü AYRI satırdır; aynı ölçü toplanır.
 */
export async function sepeteEkle(
  cartUid: string,
  productUid: string,
  quantity: string,
  token?: string | null,
  params?: SepetParametreGirdisi[],
): Promise<Cart> {
  return apiIstemci<Cart>("/carts/lines", {
    metot: "POST",
    govde: { cartUid, productUid, quantity, params: params ?? [] },
    token,
  });
}

/**
 * Satır miktarını MUTLAK değere çeker; "0" satırı siler. lineUid verilirse o
 * satır (parametreli satırlar yalnız böyle adreslenir), yoksa ürünün
 * parametresiz satırı.
 */
export async function satirAyarla(
  cartUid: string,
  productUid: string,
  quantity: string,
  token?: string | null,
  lineUid?: string,
): Promise<Cart> {
  return apiIstemci<Cart>(yol(cartUid, "/lines"), {
    metot: "PUT",
    govde: { productUid, quantity, lineUid: lineUid ?? "" },
    token,
  });
}

export async function adresYaz(
  cartUid: string,
  input: CartAddressInput,
  token?: string | null,
): Promise<Cart> {
  return apiIstemci<Cart>(yol(cartUid, "/address"), {
    metot: "PUT",
    govde: input,
    token,
  });
}

export async function kuponUygula(
  cartUid: string,
  code: string,
  token?: string | null,
): Promise<Cart> {
  return apiIstemci<Cart>(yol(cartUid, "/coupon"), {
    metot: "POST",
    govde: { code },
    token,
  });
}

export async function kuponKaldir(cartUid: string, token?: string | null): Promise<Cart> {
  return apiIstemci<Cart>(yol(cartUid, "/coupon"), { metot: "DELETE", token });
}

/**
 * Girişten sonra misafir sepetini hesaba taşır (token ŞART).
 * Hesabın açık sepeti varsa satırlar birleşir (miktarlar toplanır, fiyatlar
 * yeniden çözülür); yoksa misafir sepeti hesaba bağlanır. Dönen sepetin
 * uid'i saklanmalıdır — birleşmede uid DEĞİŞEBİLİR.
 */
export async function sepetBirlestir(guestCartUid: string, token: string): Promise<Cart> {
  return apiIstemci<Cart>("/carts/merge", {
    metot: "POST",
    govde: { guestCartUid },
    token,
  });
}

/**
 * Teslimat seçenekleri — ücretler BU SEPETE göre çözülmüş gelir ("şu tutar
 * üstü ücretsiz" eşiği sepetin net matrahına bakar). cartUid boşsa tarife
 * listesi eşiksiz döner.
 */
export async function kargoSecenekleri(
  cartUid: string,
  token?: string | null,
): Promise<ShippingMethod[]> {
  const d = await apiIstemci<{ methods: ShippingMethod[] }>(
    `/shipping/methods${cartUid ? `?cart=${encodeURIComponent(cartUid)}` : ""}`,
    { token },
  );
  return d.methods;
}

/**
 * Teslimat TARİFESİ — sunucu tarafı (sepetsiz) okuma. Ürün sayfasındaki
 * "Teslimat ve İade" kutusu bunu kullanır: orada henüz sepet yoktur, bu yüzden
 * ücretler tarifedeki sabit değerlerdir ve ücretsiz kargo sınırı bilgi olarak
 * gösterilir. Sepetteki gerçek ücret yine sepet yanıtından okunur (V5).
 */
export async function kargoTarifesiGetir(): Promise<ShippingMethod[]> {
  try {
    const d = await apiSunucu<{ methods: ShippingMethod[] }>("/shipping/methods", {
      revalidate: 300,
    });
    return d.methods;
  } catch {
    return [];
  }
}

/** Sepete teslimat yöntemini yazar; GÜNCEL sepeti döndürür (kupon uçlarıyla aynı sözleşme). */
export async function kargoSec(
  cartUid: string,
  code: string,
  token?: string | null,
): Promise<Cart> {
  return apiIstemci<Cart>(yol(cartUid, "/shipping"), {
    metot: "PUT",
    govde: { code },
    token,
  });
}
