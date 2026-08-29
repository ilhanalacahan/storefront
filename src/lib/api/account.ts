import { apiIstemci } from "./client";
import type {
  StorefrontAccount,
  StorefrontAddress,
  StorefrontAuthPayload,
  StorefrontOrder,
} from "./types";

/**
 * Müşteri hesabı — kanal kapsamlıdır: aynı e-posta başka kanalda başka hesaptır.
 * Kayıt için kvkkAccepted=true zorunlu; parola 8-128 karakter.
 * 5 hatalı giriş → 15 dk kilit (backend aynı genel hatayı döndürür).
 *
 * Kayıt ve giriş ANONİM uçlardır (yalnız kanal anahtarı); geri kalanı
 * storefront token'ı ister.
 */

export async function kayitOl(input: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  kvkkAccepted: boolean;
  marketingConsent?: boolean;
}): Promise<StorefrontAuthPayload> {
  return apiIstemci<StorefrontAuthPayload>("/account/register", {
    metot: "POST",
    govde: {
      email: input.email,
      password: input.password,
      fullName: input.fullName ?? "",
      phone: input.phone ?? "",
      kvkkAccepted: input.kvkkAccepted,
      marketingConsent: input.marketingConsent ?? false,
    },
  });
}

export async function girisYap(email: string, password: string): Promise<StorefrontAuthPayload> {
  return apiIstemci<StorefrontAuthPayload>("/account/login", {
    metot: "POST",
    govde: { email, password },
  });
}

export async function beniGetir(token: string): Promise<StorefrontAccount | null> {
  try {
    return await apiIstemci<StorefrontAccount>("/account/me", { token });
  } catch {
    // Süresi dolmuş/iptal edilmiş token 401'dir — çağıran oturumu düşürür.
    return null;
  }
}

export async function siparislerim(token: string): Promise<StorefrontOrder[]> {
  const d = await apiIstemci<{ orders: StorefrontOrder[] }>("/account/orders", { token });
  return d.orders;
}

export interface StorefrontOrderLine {
  /** Ürün kartı silinmişse ''. */
  productUid: string;
  /** Sipariş anındaki ad snapshot'ı. */
  name: string;
  quantity: string;
  unit: string;
  /** KDV dahil birim fiyat. */
  unitPrice: string;
  /** KDV dahil satır toplamı. */
  lineTotal: string;
}

export interface StorefrontOrderDetail extends StorefrontOrder {
  /** Teslimat DAMGALARI — sipariş anındaki karar; tarife sonradan değişse de sabit. */
  shippingFee: string;
  /** Kargo firması / teslimat yönteminin adı ('' = teslimat yöntemi seçilmemiş). */
  shipperCompName: string;
  /** Takip numarası ('' = mağaza henüz girmedi). */
  trackingCode: string;
  despatchName: string;
  despatchAddress: string;
  despatchCity: string;
  lines: StorefrontOrderLine[];
}

/** Tek siparişin satırlı detayı — yalnız hesabın kendi siparişi. */
export async function siparisDetay(
  token: string,
  uid: string,
): Promise<StorefrontOrderDetail | null> {
  try {
    return await apiIstemci<StorefrontOrderDetail>(
      `/account/orders/${encodeURIComponent(uid)}`,
      { token },
    );
  } catch {
    // Başkasının siparişi de "bulunamadı"dır — varlık sızdırılmaz.
    return null;
  }
}

export async function adreslerim(token: string): Promise<StorefrontAddress[]> {
  const d = await apiIstemci<{ addresses: StorefrontAddress[] }>("/account/addresses", {
    token,
  });
  return d.addresses;
}

export async function adresKaydet(
  token: string,
  input: Partial<StorefrontAddress> & { address: string },
  uid = "",
): Promise<StorefrontAddress> {
  const govde = {
    title: input.title ?? "",
    fullName: input.fullName ?? "",
    phone: input.phone ?? "",
    address: input.address,
    district: input.district ?? "",
    city: input.city ?? "",
    country: input.country ?? "",
    postalCode: input.postalCode ?? "",
    compName: input.compName ?? "",
    taxNumber: input.taxNumber ?? "",
    taxOffice: input.taxOffice ?? "",
    isDefaultShip: input.isDefaultShip ?? false,
    isDefaultBill: input.isDefaultBill ?? false,
  };
  // Yeni kayıt POST, var olanı değiştirmek PUT: hangisini yaptığımız yoldan
  // ve metottan okunur (backend ikisini de aynı upsert servisine indirir).
  return uid
    ? apiIstemci<StorefrontAddress>(`/account/addresses/${encodeURIComponent(uid)}`, {
        metot: "PUT",
        govde,
        token,
      })
    : apiIstemci<StorefrontAddress>("/account/addresses", {
        metot: "POST",
        govde,
        token,
      });
}

export async function adresSil(token: string, uid: string): Promise<void> {
  await apiIstemci(`/account/addresses/${encodeURIComponent(uid)}`, {
    metot: "DELETE",
    token,
  });
}

/** Profil bilgisi güncelleme (ad/telefon/pazarlama izni). */
export async function profilGuncelle(
  token: string,
  input: { fullName?: string; phone?: string; marketingConsent?: boolean },
): Promise<StorefrontAccount> {
  return apiIstemci<StorefrontAccount>("/account/me", {
    metot: "PUT",
    govde: {
      fullName: input.fullName ?? "",
      phone: input.phone ?? "",
      marketingConsent: input.marketingConsent ?? false,
    },
    token,
  });
}

/** Şifre değiştirme — eski şifre doğrulanır. */
export async function sifreDegistir(
  token: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await apiIstemci("/account/password", {
    metot: "PUT",
    govde: { oldPassword, newPassword },
    token,
  });
}

/**
 * Parola sıfırlama isteği. Yanıt, e-posta kayıtlı OLSA DA OLMASA DA aynıdır —
 * sunucu hesap varlığını sızdırmaz; arayüz de "kayıtlıysa gönderildi" der.
 */
export async function sifreSifirlamaIste(email: string): Promise<void> {
  await apiIstemci("/account/password/forgot", { metot: "POST", govde: { email } });
}

/** Jetonla yeni parola belirler (anonim uç — yetki jetondadır). */
export async function sifreSifirla(token: string, newPassword: string): Promise<void> {
  await apiIstemci("/account/password/reset", {
    metot: "POST",
    govde: { token, newPassword },
  });
}

/** Giriş yapmış hesaba doğrulama bağlantısı yollar. */
export async function dogrulamaMailiGonder(token: string): Promise<void> {
  await apiIstemci("/account/verify/send", { metot: "POST", govde: {}, token });
}

/** E-postayı doğrular (anonim — bağlantıya başka cihazdan tıklanmış olabilir). */
export async function epostaDogrula(kod: string): Promise<void> {
  await apiIstemci("/account/verify", { metot: "POST", govde: { token: kod } });
}
